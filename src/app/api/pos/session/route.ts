import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { POSSession } from '@/models/index';
import { Seller } from '@/models/Seller';
import { getSession } from '@/lib/auth';

export async function POST() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const seller = await Seller.findOne({ userId: session.id });
    if (!seller) {
      return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });
    }

    // Close any existing open sessions
    await POSSession.updateMany(
      { sellerId: seller._id, status: 'open' },
      { status: 'closed', closedAt: new Date() }
    );

    const posSession = await POSSession.create({
      sellerId: seller._id,
      shopId: seller.shopId,
      staffId: session.id,
      status: 'open',
      openedAt: new Date(),
      openingCash: 0,
    });

    return NextResponse.json({ success: true, data: posSession });
  } catch (error) {
    console.error('POS session error:', error);
    return NextResponse.json({ success: false, error: 'Failed to open session' }, { status: 500 });
  }
}
