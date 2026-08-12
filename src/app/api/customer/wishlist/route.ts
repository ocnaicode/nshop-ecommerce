import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { CustomerProfile } from '@/models/index';
import { Product } from '@/models/Product';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const profile = await CustomerProfile.findOne({ userId: session.id }).populate('wishlist', 'name slug price discountPrice images stock').lean();
    return NextResponse.json({ success: true, data: profile?.wishlist || [] });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { productId } = await request.json();
    let profile = await CustomerProfile.findOne({ userId: session.id });
    if (!profile) profile = new CustomerProfile({ userId: session.id, wishlist: [] });
    if (!profile.wishlist.includes(productId)) { profile.wishlist.push(productId); await profile.save(); }
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    await CustomerProfile.findOneAndUpdate({ userId: session.id }, { $pull: { wishlist: productId } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}
