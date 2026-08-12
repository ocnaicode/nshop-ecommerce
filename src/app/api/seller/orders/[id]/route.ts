import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { getSession } from '@/lib/auth';
import { sendNotification } from '@/services/notification.service';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing'],
  preparing: ['ready'],
  ready: ['on_the_way', 'delivered'],
  on_the_way: ['delivered'],
};

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    if (order.sellerId.toString() !== session.sellerId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { status } = await request.json();
    const valid = VALID_TRANSITIONS[order.status];
    if (!valid || !valid.includes(status)) {
      return NextResponse.json({ success: false, error: `Cannot transition from ${order.status} to ${status}` }, { status: 400 });
    }

    order.status = status;
    order.timeline.push({
      status,
      description: `Order ${status.replace('_', ' ')} by seller`,
      timestamp: new Date(),
      actorId: session.id,
      actorRole: 'seller',
    });

    // Release stock reservation on cancellation
    if (status === 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { reservedStock: -item.quantity },
        });
      }
    }

    // Mark as delivered
    if (status === 'delivered') {
      order.deliveryStatus = 'delivered';
      // Release reserved stock and increase sold
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { reservedStock: -item.quantity, totalSold: item.quantity },
        });
      }
    }

    await order.save();

    // Send notification to customer
    await sendNotification({
      userId: order.customerId.toString(),
      event: status === 'delivered' ? 'order_delivered' : 
             status === 'cancelled' ? 'order_cancelled' :
             status === 'accepted' ? 'order_accepted' :
             status === 'ready' ? 'order_ready' : 'order_created',
      data: { orderNumber: order.orderNumber },
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
