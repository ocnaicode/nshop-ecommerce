import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { CustomerProfile, SystemConfig } from '@/models/index';
import { Product } from '@/models/Product';
import { Shop } from '@/models/Shop';
import { Seller } from '@/models/Seller';
import { getSession } from '@/lib/auth';
import { calculateShippingFee, calculateDistance, type ShippingBreakdown } from '@/lib/shipping';
import { estimateSchema } from '@/validators';

export const dynamic = 'force-dynamic';

// Live delivery-fee estimation used by the checkout page.
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = estimateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { items, addressId, deliveryMethod } = validation.data;

    const profile = await CustomerProfile.findOne({ userId: session.id }).lean();
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Customer profile not found' }, { status: 404 });
    }
    const address = (profile.savedAddresses || []).find(
      (a: { _id: { toString(): string } }) => a._id.toString() === addressId
    );
    if (!address) {
      return NextResponse.json({ success: false, error: 'Address not found' }, { status: 404 });
    }

    const products = await Product.find({ _id: { $in: items.map(i => i.productId) } }).lean();
    let subtotal = 0;
    const sellerIds = new Set<string>();
    for (const item of items) {
      const product = products.find((p) => p._id.toString() === item.productId);
      if (!product) continue;
      const effectivePrice = product.discountPrice || product.price;
      if (item.variantId) {
        const variant = product.variants?.find(
          (v: { _id: { toString(): string } }) => v._id.toString() === item.variantId
        );
        if (variant) subtotal += (variant.discountPrice || variant.price) * item.quantity;
        continue;
      }
      subtotal += effectivePrice * item.quantity;
      sellerIds.add(product.sellerId.toString());
    }

    // Multi-seller checkout is not supported in the MVP — estimate for the first seller.
    const seller = await Seller.findById([...sellerIds][0]);
    const shop = seller ? await Shop.findById(seller.shopId).lean() : null;

    let distanceKm = 0;
    const customerLat = address.location?.coordinates?.[1];
    const customerLng = address.location?.coordinates?.[0];
    const shopLat = shop?.location?.coordinates?.[1];
    const shopLng = shop?.location?.coordinates?.[0];
    if (
      deliveryMethod !== 'self_pickup' &&
      customerLat != null && customerLng != null && shopLat != null && shopLng != null
    ) {
      distanceKm = calculateDistance(customerLat, customerLng, shopLat, shopLng);
    }

    let platformPercentage = 15;
    const config = await SystemConfig.findOne({ key: 'platform_delivery_percentage' }).lean();
    if (config?.value) platformPercentage = Number(config.value);

    const breakdown: ShippingBreakdown = calculateShippingFee({
      subtotal,
      deliveryMethod,
      distanceKm,
      zones: seller?.deliveryConfig?.sellerDelivery?.zones || [],
      baseFee: seller?.deliveryConfig?.sellerDelivery?.baseFee || 30,
      perKmFee: seller?.deliveryConfig?.sellerDelivery?.perKmFee,
      freeDeliveryThreshold: seller?.deliveryConfig?.sellerDelivery?.freeDeliveryThreshold,
      platformPercentage,
      platformMinFee: Number(process.env.PLATFORM_DELIVERY_MIN_FEE || 20),
      platformMaxFee: Number(process.env.PLATFORM_DELIVERY_MAX_FEE || 300),
    });

    return NextResponse.json({
      success: true,
      data: {
        deliveryFee: breakdown.totalFee,
        breakdown,
        distanceKm: Math.round(distanceKm * 10) / 10,
        subtotal,
      },
    });
  } catch (error) {
    console.error('Shipping estimate error:', error);
    return NextResponse.json({ success: false, error: 'Failed to estimate delivery' }, { status: 500 });
  }
}
