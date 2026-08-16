import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Order } from '@/models/Order';
import { Cart, Payment, SellerWallet, WalletTransaction, Delivery, CommissionRule, Coupon, SystemConfig, LoyaltyAccount, LoyaltyTransaction, Referral } from '@/models/index';
import { Product } from '@/models/Product';
import { Shop } from '@/models/Shop';
import { Seller } from '@/models/Seller';
import { getSession, isAdmin } from '@/lib/auth';
import { checkoutSchema, orderStatusSchema } from '@/validators';
import { generateOrderNumber, generatePickupCode, calculateDistance, getPaginationParams } from '@/lib/utils';
import { calculateShippingFee } from '@/lib/shipping';
import { LOYALTY_CONFIG, NOTIFICATION_EVENTS } from '@/config/constants';
import { initiateGatewayPayment, isPaymentMethodEnabled } from '@/lib/payments';
import { notifyUser } from '@/lib/notify';

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

    // Calculate delivery fee (advanced shipping calculator)
    let deliveryFee = 0;
    let distanceKm = 0;
    if (deliveryMethod !== 'self_pickup') {
      const customerLat = address.location.coordinates[1];
      const customerLng = address.location.coordinates[0];
      const shopLat = shop.location.coordinates[1];
      const shopLng = shop.location.coordinates[0];
      distanceKm = calculateDistance(customerLat, customerLng, shopLat, shopLng);
    }

    let platformPercentage = 15;
    const platformConfig = await SystemConfig.findOne({ key: 'platform_delivery_percentage' });
    if (platformConfig?.value) platformPercentage = Number(platformConfig.value);

    const shipping = calculateShippingFee({
      subtotal,
      deliveryMethod,
      distanceKm,
      zones: seller.deliveryConfig?.sellerDelivery?.zones || [],
      baseFee: seller.deliveryConfig?.sellerDelivery?.baseFee || 30,
      perKmFee: seller.deliveryConfig?.sellerDelivery?.perKmFee,
      freeDeliveryThreshold: seller.deliveryConfig?.sellerDelivery?.freeDeliveryThreshold,
      platformPercentage,
      platformMinFee: Number(process.env.PLATFORM_DELIVERY_MIN_FEE || 20),
      platformMaxFee: Number(process.env.PLATFORM_DELIVERY_MAX_FEE || 300),
    });
    deliveryFee = shipping.totalFee;

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

    // Loyalty points redemption
    const loyaltyPointsUsed = validation.data.loyaltyPoints || 0;
    let loyaltyDiscount = 0;
    if (loyaltyPointsUsed > 0) {
      if (loyaltyPointsUsed > (profile.loyaltyPoints || 0)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient loyalty points' },
          { status: 400 }
        );
      }
      const maxRedeemable = Math.floor(
        (subtotal + deliveryFee + codFee) * LOYALTY_CONFIG.maxRedeemPct
      );
      const pointValue = Math.min(
        loyaltyPointsUsed * LOYALTY_CONFIG.redeemRate,
        maxRedeemable
      );
      loyaltyDiscount = Math.floor(pointValue);
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

    const total = Math.max(
      0,
      subtotal + deliveryFee + codFee - couponDiscount - loyaltyDiscount
    );

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
      discount: couponDiscount + loyaltyDiscount,
      codFee,
      platformFee,
      commission,
      total,
      couponCode: couponCode?.toUpperCase(),
      couponDiscount,
      loyaltyPointsUsed,
      loyaltyPointsEarned: Math.floor(total * LOYALTY_CONFIG.earnRate),
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
    const payment = await Payment.create({
      orderId: order._id,
      customerId: session.id,
      sellerId,
      method: paymentMethod,
      amount: total,
      status: paymentMethod === 'cod' ? 'pending' : 'pending',
    });

    // Redeem loyalty points (deduct balance & log transaction)
    if (loyaltyPointsUsed > 0 && loyaltyDiscount > 0) {
      const account = await LoyaltyAccount.findOneAndUpdate(
        { customerId: session.id },
        { $inc: { points: -loyaltyPointsUsed, totalRedeemed: loyaltyPointsUsed } },
        { upsert: true, new: true }
      );
      await LoyaltyTransaction.create({
        accountId: account._id,
        customerId: session.id,
        type: 'redeemed',
        points: -loyaltyPointsUsed,
        description: `Redeemed on order ${order.orderNumber}`,
        referenceId: order._id,
        referenceType: 'order',
      });
      await CustomerProfile.findOneAndUpdate(
        { userId: session.id },
        { $inc: { loyaltyPoints: -loyaltyPointsUsed } }
      );
    }

    // Earn loyalty points
    const pointsEarned = Math.floor(total * LOYALTY_CONFIG.earnRate);
    if (pointsEarned > 0) {
      const account = await LoyaltyAccount.findOneAndUpdate(
        { customerId: session.id },
        { $inc: { points: pointsEarned, totalEarned: pointsEarned } },
        { upsert: true, new: true }
      );
      await LoyaltyTransaction.create({
        accountId: account._id,
        customerId: session.id,
        type: 'earned',
        points: pointsEarned,
        description: `Earned on order ${order.orderNumber}`,
        referenceId: order._id,
        referenceType: 'order',
      });
      await CustomerProfile.findOneAndUpdate(
        { userId: session.id },
        { $inc: { loyaltyPoints: pointsEarned } }
      );
    }

    // Referral bonus — award the referrer when the referred customer places an order
    if (profile.referredBy && profile.referredBy !== String(session.id)) {
      const existing = await Referral.findOne({ referredId: session.id });
      if (!existing) {
        await Referral.create({
          referrerId: profile.referredBy,
          referrerType: 'customer',
          referredId: session.id,
          referredType: 'customer',
          status: 'completed',
          rewardAmount: LOYALTY_CONFIG.referralBonus,
          rewardType: 'loyalty_points',
        });
        const bonus = LOYALTY_CONFIG.referralBonus;
        const referrerAccount = await LoyaltyAccount.findOneAndUpdate(
          { customerId: profile.referredBy },
          { $inc: { points: bonus, totalEarned: bonus } },
          { upsert: true, new: true }
        );
        await LoyaltyTransaction.create({
          accountId: referrerAccount._id,
          customerId: profile.referredBy,
          type: 'bonus',
          points: bonus,
          description: `Referral bonus — ${order.orderNumber}`,
          referenceId: order._id,
          referenceType: 'order',
        });
        await notifyUser({
          userId: String(profile.referredBy),
          type: NOTIFICATION_EVENTS.REFERRAL_REWARDED,
          title: 'Referral Reward!',
          message: `You earned ${bonus} loyalty points from a successful referral.`,
        });
      }
    }

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

    // Notify customer (order placed)
    await notifyUser({
      userId: session.id,
      type: NOTIFICATION_EVENTS.ORDER_CREATED,
      title: 'Order Placed',
      message: `Your order ${order.orderNumber} (৳${total}) has been placed successfully.`,
      data: { orderId: String(order._id) },
      phone: session.phone,
      email: session.email,
    });

    // Initiate gateway payment for online payment methods
    let paymentInfo: Record<string, unknown> | null = null;
    if (paymentMethod !== 'cod' && isPaymentMethodEnabled(paymentMethod)) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const gateway = await initiateGatewayPayment({
        method: paymentMethod,
        amount: total,
        orderNumber: order.orderNumber,
        customer: { name: session.name, phone: session.phone, email: session.email },
        productName: orderItems[0]?.name || 'LocalMart Order',
        returnUrl: `${appUrl}/api/payments/${paymentMethod}/callback`,
        callbackUrl: `${appUrl}/api/payments/${paymentMethod}/callback`,
      });
      if (gateway.transactionId) {
        await Payment.updateOne(
          { _id: payment._id },
          {
            $set: {
              transactionId: gateway.transactionId,
              gatewayResponse: { initiatedAt: new Date().toISOString(), status: gateway.status },
            },
          }
        );
      }
      paymentInfo = {
        method: paymentMethod,
        status: gateway.status,
        paymentUrl: gateway.gatewayUrl || null,
        transactionId: gateway.transactionId || null,
      };
    }

    return NextResponse.json({
      success: true,
      data: order,
      payment: paymentInfo,
      message: 'Order placed successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}
