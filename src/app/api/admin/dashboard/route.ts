import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { SellerWallet, Withdrawal, Dispute, AuditLog } from '@/models/index';
import { Seller } from '@/models/Seller';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { Shop } from '@/models/Shop';
import { getSession, isAdmin } from '@/lib/auth';

function daysAgo(n: number) {
  const x = new Date();
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - n);
  return x;
}

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const sevenDaysAgo = daysAgo(7);
    const fourteenDaysAgo = daysAgo(14);

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
      newUsersThisWeek,
      newUsersLastWeek,
      newOrdersThisWeek,
      newOrdersLastWeek,
      activeSellers,
      recentActivity,
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
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Order.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      Seller.countDocuments({ status: 'active' }),
      AuditLog.find({}).sort({ createdAt: -1 }).limit(8).populate('actorId', 'name role').lean(),
    ]);

    const pctChange = (curr: number, prev: number) => {
      if (prev === 0) return curr === 0 ? 0 : 100;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };

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
        trends: {
          users: pctChange(newUsersThisWeek, newUsersLastWeek),
          orders: pctChange(newOrdersThisWeek, newOrdersLastWeek),
        },
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}
