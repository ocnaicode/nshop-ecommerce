import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Product } from '@/models/Product';
import { Review } from '@/models/index';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await dbConnect();
    const { slug } = await params;

    const product = await Product.findOne({ slug })
      .populate('category', 'name slug')
      .populate('shopId', 'name slug logo rating isOpen')
      .lean();

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Get recent reviews
    const reviews = await Review.find({ productId: product._id, isApproved: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customerId', 'name avatar')
      .lean();

    // Get related products
    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      status: { $in: ['active', 'published'] },
    }).limit(4).lean();

    return NextResponse.json({
      success: true,
      data: { ...product, reviews, related },
    });
  } catch (error) {
    console.error('Product detail error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch product' }, { status: 500 });
  }
}
