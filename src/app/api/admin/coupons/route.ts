import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Coupon } from '@/models/index';
import { getSession, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || !isAdmin(session.role)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: coupons });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || !isAdmin(session.role)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const coupon = await Coupon.create({ ...body, createdBy: session.id });
    return NextResponse.json({ success: true, data: coupon }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}
