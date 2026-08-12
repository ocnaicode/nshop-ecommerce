import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Review } from '@/models/index';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { Shop } from '@/models/Shop';
import { getSession } from '@/lib/auth';
import { reviewSchema } from '@/validators';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'customer') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, productId, ...reviewData } = body;

    // Validate order belongs to customer and is delivered
    const order = await Order.findById(orderId);
    if (!order || order.customerId.toString() !== session.id) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    if (order.status !== 'delivered') {
      return NextResponse.json({ success: false, error: 'Can only review delivered orders' }, { status: 400 });
    }

    // Check for duplicate review
    const existing = await Review.findOne({ customerId: session.id, productId });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Already reviewed this product' }, { status: 400 });
    }

    const validation = reviewSchema.safeParse(reviewData);
    if (!validation.success) {
      return NextResponse.json({ success: false, errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const review = await Review.create({
      orderId,
      customerId: session.id,
      productId,
      sellerId: order.sellerId,
      shopId: order.shopId,
      ...validation.data,
    });

    // Update product rating
    const allReviews = await Review.find({ productId, isApproved: true });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      totalRatings: allReviews.length,
    });

    return NextResponse.json({ success: true, data: review, message: 'Review submitted' }, { status: 201 });
  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit review' }, { status: 500 });
  }
}
