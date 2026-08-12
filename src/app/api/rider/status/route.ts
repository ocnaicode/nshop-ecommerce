import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Rider } from '@/models/index';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'rider') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { isOnline } = await request.json();
    const rider = await Rider.findOneAndUpdate(
      { userId: session.id },
      { isOnline, isAvailable: isOnline },
      { new: true }
    );

    return NextResponse.json({ success: true, data: rider });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update status' }, { status: 500 });
  }
}
