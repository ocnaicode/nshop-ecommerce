import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Seller } from '@/models/Seller';
import { getSession, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || !isAdmin(session.role)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const sellers = await Seller.find({}).populate('shopId', 'name slug').sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: sellers });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || !isAdmin(session.role)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { sellerId, action } = await request.json();
    if (action === 'approve') await Seller.findByIdAndUpdate(sellerId, { verificationStatus: 'approved', isVerified: true, status: 'active' });
    else if (action === 'reject') await Seller.findByIdAndUpdate(sellerId, { verificationStatus: 'rejected' });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}
