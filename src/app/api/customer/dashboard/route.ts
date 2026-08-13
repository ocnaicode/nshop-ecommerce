import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { CustomerProfile } from '@/models/index';
import { Order } from '@/models/Order';
import { getSession } from '@/lib/auth';

// Customer dashboard summary — returns a single payload for the dashboard cards.
export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'customer') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await CustomerProfile.findOne({ userId: session.id }).lean();

    const [totalOrders, totalSpent, recentOrders] = await Promise.all([
      Order.countDocuments({ customerId: session.id }),
      Order.aggregate([
        { $match: { customerId: session.id, status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.find({ customerId: session.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('shopId', 'name slug logo')
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        totalSpent: totalSpent[0]?.total || 0,
        wishlistCount: profile?.wishlist?.length || 0,
        addressesCount: profile?.savedAddresses?.length || 0,
        loyaltyPoints: profile?.loyaltyPoints || 0,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Customer dashboard error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}
