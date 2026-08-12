import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Rider, Delivery } from '@/models/index';
import { Order } from '@/models/Order';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'rider') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { deliveryId, action } = await request.json();
    const rider = await Rider.findOne({ userId: session.id });
    if (!rider) return NextResponse.json({ success: false, error: 'Rider not found' }, { status: 404 });

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) return NextResponse.json({ success: false, error: 'Delivery not found' }, { status: 404 });

    const statusMap: Record<string, string> = {
      accept: 'accepted',
      picked_up: 'picked_up',
      on_the_way: 'on_the_way',
      delivered: 'delivered',
      failed: 'failed',
    };

    const newStatus = statusMap[action];
    if (!newStatus) return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    // Update delivery
    delivery.status = newStatus;
    delivery.timeline.push({ status: newStatus, timestamp: new Date() });
    
    if (action === 'accept') {
      delivery.riderId = rider._id;
      await Rider.findByIdAndUpdate(rider._id, { currentDeliveryId: delivery._id, isAvailable: false });
    }

    if (action === 'delivered') {
      delivery.riderEarnings = 50; // Default earning
      delivery.actualTime = Math.round((Date.now() - delivery.createdAt.getTime()) / 60000);
      await Rider.findByIdAndUpdate(rider._id, {
        currentDeliveryId: null,
        isAvailable: true,
        $inc: { totalDeliveries: 1, totalEarnings: 50 },
      });
      // Update order status
      await Order.findByIdAndUpdate(delivery.orderId, {
        status: 'delivered',
        deliveryStatus: 'delivered',
        $push: { timeline: { status: 'delivered', description: 'Order delivered', timestamp: new Date() } },
      });
    }

    if (action === 'failed') {
      await Rider.findByIdAndUpdate(rider._id, { currentDeliveryId: null, isAvailable: true });
    }

    await delivery.save();

    return NextResponse.json({ success: true, data: delivery });
  } catch (error) {
    console.error('Delivery action error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}
