import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Supplier, Purchase, Inventory, InventoryTransaction } from '@/models/index';
import { Product } from '@/models/Product';
import { Seller } from '@/models/Seller';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const seller = await Seller.findOne({ userId: session.id });
    if (!seller) return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });

    const suppliers = await Supplier.find({ sellerId: seller._id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const seller = await Seller.findOne({ userId: session.id });
    if (!seller) return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });

    const body = await request.json();
    const { name, phone, address, email } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: 'Name and phone required' }, { status: 400 });
    }

    const supplier = await Supplier.create({
      sellerId: seller._id,
      name,
      phone,
      address,
      email,
      totalDue: 0,
      totalPaid: 0,
      balance: 0,
    });

    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create supplier' }, { status: 500 });
  }
}
