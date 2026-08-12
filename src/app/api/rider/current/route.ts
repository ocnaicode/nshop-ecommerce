import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Rider } from '@/models/index';
import { Delivery } from '@/models/index';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'rider') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const rider = await Rider.findOne({ userId: session.id });
    if (!rider || !rider.currentDeliveryId) {
      return NextResponse.json({ success: true, data: null });
    }

    const delivery = await Delivery.findById(rider.currentDeliveryId).lean();
    return NextResponse.json({ success: true, data: delivery });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}
