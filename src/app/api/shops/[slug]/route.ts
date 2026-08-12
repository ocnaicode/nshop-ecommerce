import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Shop } from '@/models/Shop';
import { Seller } from '@/models/Seller';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await dbConnect();
    const { slug } = await params;

    const shop = await Shop.findOne({ slug })
      .populate('category', 'name slug icon')
      .populate('sellerId', 'businessName codConfig deliveryConfig openingHours')
      .lean();

    if (!shop) {
      return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: shop });
  } catch (error) {
    console.error('Shop detail error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch shop' }, { status: 500 });
  }
}
