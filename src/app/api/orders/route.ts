import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Order } from '@/models/Order';
import { Cart, Payment, SellerWallet, WalletTransaction, Delivery, CommissionRule, Coupon, SystemConfig } from '@/models/index';
import { Product } from '@/models/Product';
import { Shop } from '@/models/Shop';
import { Seller } from '@/models/Seller';
import { User } from '@/models/User';
import { getSession, isAdmin } from '@/lib/auth';
import { checkoutSchema, orderStatusSchema } from '@/validators';
import { generateOrderNumber, generatePickupCode, calculateDistance, getPaginationParams } from '@/lib/utils';
import { earnPoints } from '@/services/loyalty.service';
import { emitRealtime } from '@/server/realtime';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const query: Record<string, unknown> = {};

    if (session.role === 'customer') {
      query.customerId = session.id;
    } else if (session.role === 'seller' && session.sellerId) {
      query.sellerId = session.sellerId;
    } else if (!isAdmin(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const status = searchParams.get('status');
    if (status) query.status = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('shopId', 'name slug logo')
        .populate('customerId', 'name phone')
        .lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { items, addressId, deliveryMethod, paymentMethod, couponCode, notes } = validation.data;

    // Get customer profile with addresses
    const { CustomerProfile } = await import('@/models/index');
    const profile = await CustomerProfile.findOne({ userId: session.id });
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Customer profile not found' }, { status: 404 });
    }

    const address = profile.savedAddresses.find((a: any) => a._id.toString() === addressId);
    if (!address) {
      return NextResponse.json({ success: false, error: 'Address not found' }, { status: 404 });
    }

    // Verify all products and group by seller
    const productIds = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();

    if (products.length !== items.length) {
      return NextResponse.json({ success: false, error: 'Some products not found' }, { status: 404 });
    }

    // Group items by seller (for initial MVP, single-seller checkout)
    const sellerMap = new Map<string, any[]>();
    for (const item of items) {
      const product = products.find((p: any) => p._id.toString() === item.productId);
      if (!product) continue;

      const sellerId = product.sellerId.toString();
      if (!sellerMap.has(sellerId)) sellerMap.set(sellerId, []);
      sellerMap.get(sellerId)!.push({ ...item, product });
    }

    if (sellerMap.size > 1) {
      return NextResponse.json(
        { success: false, error: 'Please checkout items from one seller at a time' },
        { status: 400 }
      );
    }

    const [sellerId, sellerItems] = [...sellerMap.entries()][0];
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });
    }

    const shop = await Shop.findById(seller.shopId);
    if (!shop) {
      return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
    }

    // Build order items with snapshots
    const orderItems: any[] = [];
    const productSnapshots: Record<string, any> = {};
    let subtotal = 0;

    for (const item of sellerItems) {
      const product = item.product;

      // Verify stock
      let availableStock = product.stock - product.reservedStock;
      let price = product.price;
      let discountPrice = product.discountPrice;

      if (item.variantId) {
        const variant = product.variants.find((v: any) => v._id.toString() === item.variantId);
        if (!variant) {
          return NextResponse.json({ success: false, error: `Variant not found for ${product.name}` }, { status: 400 });
        }
        availableStock = variant.stock;
        price = variant.price;
        discountPrice = variant.discountPrice;
      }

      if (item.quantity > availableStock) {
        return NextResponse.json(
          { success: false, error: `${product.name}: Only ${availableStock} available` },
          { status: 400 }
        );
      }

      const effectivePrice = discountPrice || price;
      const itemSubtotal = effectivePrice * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product._id,
        variantId: item.variantId,
        name: product.name,
        image: product.images[0] || '',
        sku: product.sku,
        price,
        discountPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });

      productSnapshots[product._id.toString()] = {
        name: product.name,
        price: effectivePrice,
        sku: product.sku,
      };
    }

    // Calculate delivery fee
    let deliveryFee = 0;
    if (deliveryMethod === 'seller_delivery') {
      const customerLat = address.location.coordinates[1];
      const customerLng = address.location.coordinates[0];
      const shopLat = shop.location.coordinates[1];
      const shopLng = shop.location.coordinates[0];
      const distance = calculateDistance(customerLat, customerLng, shopLat, shopLng);

      // Find matching zone
      const zones = seller.deliveryConfig.sellerDelivery.zones;
      if (zones.length > 0) {
        const zone = zones.find((z: any) => distance >= z.minDistance && distance <= z.maxDistance);
        deliveryFee = zone ? zone.fee : zones[zones.length - 1].fee;
      } else {
        deliveryFee = 30; // Default
      }

      // Free delivery threshold
      if (seller.deliveryConfig.sellerDelivery.freeDeliveryThreshold &&
          subtotal >= seller.deliveryConfig.sellerDelivery.freeDeliveryThreshold) {
        deliveryFee = 0;
      }
    } else if (deliveryMethod === 'platform_delivery') {
      const { SystemConfig } = await import('@/models/index');
      const config = await SystemConfig.findOne({ key: 'platform_delivery_percentage' });
      const percentage = config?.value || 15;
      deliveryFee = Math.round(subtotal * (percentage / 100));
    }

    // COD fee
    let codFee = 0;
    if (paymentMethod === 'cod' && seller.codConfig.enabled) {
      codFee = seller.codConfig.fee;
      if (subtotal > seller.codConfig.maxOrderAmount) {
        return NextResponse.json(
          { success: false, error: `COD not available for orders above ৳${seller.codConfig.maxOrderAmount}` },
          { status: 400 }
        );
      }
    }

    // Apply coupon
    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        const now = new Date();
        if (now >= coupon.validFrom && now <= coupon.validUntil &&
            subtotal >= coupon.minOrder && coupon.usedCount < coupon.usageLimit) {
          if (coupon.type === 'percentage') {
            couponDiscount = Math.round(subtotal * (coupon.value / 100));
            if (coupon.maxDiscount) couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
          } else if (coupon.type === 'fixed') {
            couponDiscount = coupon.value;
          } else if (coupon.type === 'free_delivery') {
            deliveryFee = 0;
          }
        }
      }
    }

    // Calculate commission
    const { CommissionRule } = await import('@/models/index');
    let commissionRate = 5; // Default
    const globalRule = await CommissionRule.findOne({ type: 'global', isActive: true }).sort({ priority: -1 });
    if (globalRule) commissionRate = globalRule.rate;

    const categoryRule = await CommissionRule.findOne({
      type: 'category',
      targetId: sellerItems[0].product.category.toString(),
      isActive: true,
    });
    if (categoryRule) commissionRate = categoryRule.rate;

    const commission = Math.round(subtotal * (commissionRate / 100));

    // Platform fee
    let platformFee = 0;
    if (deliveryMethod === 'platform_delivery') {
      const config = await (await import('@/models/index')).SystemConfig.findOne({ key: 'platform_delivery_percentage' });
      platformFee = Math.round(subtotal * ((config?.value || 15) / 100));
    }

    const total = subtotal + deliveryFee + codFee - couponDiscount;

    // Reserve stock
    for (const item of sellerItems) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { reservedStock: item.quantity },
      });
    }

    // Create order
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customerId: session.id,
      sellerId,
      shopId: seller.shopId,
      items: orderItems,
      deliveryAddress: {
        label: address.label,
        name: address.name,
        phone: address.phone,
        address: address.address,
        area: address.area,
        upazila: address.upazila,
        district: address.district,
        division: address.division,
        location: address.location,
      },
      deliveryMethod,
      deliveryFee,
      paymentMethod,
      status: 'pending',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      subtotal,
      discount: couponDiscount,
      codFee,
      platformFee,
      commission,
      total,
      couponCode: couponCode?.toUpperCase(),
      couponDiscount,
      notes,
      pickupCode: deliveryMethod === 'self_pickup' ? generatePickupCode() : undefined,
      timeline: [{
        status: 'pending',
        description: 'Order placed',
        timestamp: new Date(),
        actorId: session.id,
        actorRole: session.role,
      }],
      snapshots: {
        product: productSnapshots,
        shop: { name: shop.name, slug: shop.slug, phone: shop.phone },
        customer: { name: session.name, phone: session.phone },
        commission: { rate: commissionRate, amount: commission },
        deliveryFee: { method: deliveryMethod, amount: deliveryFee },
      },
    });

    // Create payment record
    await Payment.create({
      orderId: order._id,
      customerId: session.id,
      sellerId,
      method: paymentMethod,
      amount: total,
      status: paymentMethod === 'cod' ? 'pending' : 'pending',
    });

    // Update coupon usage
    if (couponCode) {
      await Coupon.findOneAndUpdate({ code: couponCode.toUpperCase() }, { $inc: { usedCount: 1 } });
    }

    // Create delivery record for platform delivery
    if (deliveryMethod === 'platform_delivery') {
      await Delivery.create({
        orderId: order._id,
        sellerId,
        status: 'awaiting_assignment',
        pickupLocation: shop.location,
        dropoffLocation: address.location,
        timeline: [{ status: 'created', timestamp: new Date() }],
      });
    }

    // Clear cart
    await Cart.findOneAndUpdate({ customerId: session.id }, { items: [], subtotal: 0, total: 0, couponCode: null, couponDiscount: 0 });

    // Update shop order count
    await Shop.findByIdAndUpdate(seller.shopId, { $inc: { totalOrders: 1 } });

    // Realtime events: notify customer + seller dashboards instantly
    emitRealtime({
      userId: session.id,
      event: 'order_update',
      data: { orderId: order._id.toString(), orderNumber: order.orderNumber, status: 'pending', total: order.total },
    });
    emitRealtime({
      userId: seller.userId?.toString() || '',
      sellerId,
      event: 'new_order',
      data: { orderId: order._id.toString(), orderNumber: order.orderNumber, total: order.total },
    });

    // Notifications (in-app + email/SMS via queue)
    const { sendNotification } = await import('@/services/notification.service');
    await sendNotification({
      userId: session.id,
      event: 'order_created',
      data: { orderNumber: order.orderNumber },
      channels: ['in_app', 'email', 'sms'],
    });
    await sendNotification({
      userId: (seller.userId || '').toString(),
      event: 'new_order_for_seller',
      data: { orderNumber: order.orderNumber },
      channels: ['in_app'],
    });

    // Loyalty: earn points on order placement
    await earnPoints(session.id, total, order._id.toString());

    // Referral: complete the referral when the referred customer's first order is placed
    try {
      const { completeReferral } = await import('@/services/referral.service');
      await completeReferral(session.id);
    } catch (err) {
      console.error('[referral] complete failed:', err);
    }

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Order placed successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}
