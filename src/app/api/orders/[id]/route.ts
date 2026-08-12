import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Order } from '@/models/Order';
import { getSession, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const order = await Order.findById(id)
      .populate('shopId', 'name slug phone')
      .populate('customerId', 'name phone')
      .lean();

    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    // Authorization check
    if (session.role === 'customer' && order.customerId._id.toString() !== session.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (session.role === 'seller' && order.sellerId.toString() !== session.sellerId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Order detail error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch order' }, { status: 500 });
  }
}
