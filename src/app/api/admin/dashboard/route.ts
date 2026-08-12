import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { SellerWallet, Withdrawal, Dispute } from '@/models/index';
import { Seller } from '@/models/Seller';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { Shop } from '@/models/Shop';
import { getSession, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalUsers,
      totalSellers,
      totalOrders,
      totalProducts,
      totalShops,
      pendingVerifications,
      openDisputes,
      pendingWithdrawals,
      orderRevenue,
    ] = await Promise.all([
      User.countDocuments(),
      Seller.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments(),
      Shop.countDocuments(),
      Seller.countDocuments({ verificationStatus: 'pending' }),
      Dispute.countDocuments({ status: 'open' }),
      Withdrawal.countDocuments({ status: 'pending' }),
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    const activeSellers = await Seller.countDocuments({ status: 'active' });

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalSellers,
        totalOrders,
        totalProducts,
        totalShops,
        activeSellers,
        pendingVerifications,
        openDisputes,
        pendingWithdrawals,
        totalRevenue: orderRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}
