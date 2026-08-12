import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { SellerStaff } from '@/models/index';
import { Seller } from '@/models/Seller';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const seller = await Seller.findOne({ userId: session.id });
    if (!seller) return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });
    const staff = await SellerStaff.find({ sellerId: seller._id }).populate('userId', 'name phone email').lean();
    return NextResponse.json({ success: true, data: staff });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const seller = await Seller.findOne({ userId: session.id });
    if (!seller) return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });
    const { name, phone, password, permissions } = await request.json();
    if (!name || !phone || !password) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    const existingUser = await User.findOne({ phone });
    if (existingUser) return NextResponse.json({ success: false, error: 'Phone already registered' }, { status: 400 });
    const hashed = await hashPassword(password);
    const user = await User.create({ name, phone, password: hashed, role: 'seller_staff', isVerified: true });
    const staff = await SellerStaff.create({ sellerId: seller._id, userId: user._id, name, permissions: permissions || ['dashboard', 'orders', 'pos'] });
    return NextResponse.json({ success: true, data: staff }, { status: 201 });
  } catch (error) { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    await SellerStaff.findByIdAndDelete(staffId);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}
