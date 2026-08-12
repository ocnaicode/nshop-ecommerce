import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Product } from '@/models/Product';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const product = await Product.findById(id).populate('category', 'name slug').populate('shopId', 'name slug').lean();
    if (!product) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: product });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const product = await Product.findOneAndUpdate({ _id: id, sellerId: session.sellerId }, body, { new: true });
    if (!product) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: product });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    await Product.findOneAndUpdate({ _id: id, sellerId: session.sellerId }, { status: 'archived' });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}
