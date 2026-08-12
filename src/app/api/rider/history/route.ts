import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Rider, Delivery } from '@/models/index';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'rider') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const rider = await Rider.findOne({ userId: session.id });
    if (!rider) return NextResponse.json({ success: true, data: [] });

    const deliveries = await Delivery.find({
      riderId: rider._id,
      status: { $in: ['delivered', 'failed', 'returned'] },
    }).sort({ updatedAt: -1 }).limit(20).lean();

    return NextResponse.json({ success: true, data: deliveries });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}
