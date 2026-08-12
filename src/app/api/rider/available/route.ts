import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Delivery } from '@/models/index';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'rider') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const deliveries = await Delivery.find({
      status: 'awaiting_assignment',
      riderId: { $exists: false },
    }).sort({ createdAt: 1 }).limit(10).lean();

    return NextResponse.json({ success: true, data: deliveries });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}
