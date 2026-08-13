import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';
import { Seller } from '@/models/Seller';
import { getSession } from '@/lib/auth';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const x = new Date();
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - n);
  return x;
}

// Seller dashboard summary with real computed metrics and trend indicators.
export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller' || !session.sellerId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const sellerId = session.sellerId;
    const today = startOfDay(new Date());
    const yesterday = daysAgo(1);
    const sevenDaysAgo = daysAgo(7);
    const fourteenDaysAgo = daysAgo(14);

    const [
      allOrders,
      topProducts,
      seller,
    ] = await Promise.all([
      Order.find({ sellerId }).lean(),
      Product.find({ sellerId, status: { $in: ['active', 'published'] } })
        .sort({ totalSold: -1 })
        .limit(5)
        .lean(),
      Seller.findById(sellerId).select('performance rating').lean(),
    ]);

    const delivered = allOrders.filter((o) => o.status === 'delivered');
    const pending = allOrders.filter((o) => o.status === 'pending');
    const todayOrders = allOrders.filter((o) => new Date(o.createdAt) >= today);
    const yesterdayOrders = allOrders.filter(
      (o) => new Date(o.createdAt) >= yesterday && new Date(o.createdAt) < today
    );
    const thisWeek = allOrders.filter((o) => new Date(o.createdAt) >= sevenDaysAgo);
    const lastWeek = allOrders.filter(
      (o) => new Date(o.createdAt) >= fourteenDaysAgo && new Date(o.createdAt) < sevenDaysAgo
    );

    const totalRevenue = delivered.reduce((s, o) => s + (o.total || 0), 0);
    const todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
    const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + (o.total || 0), 0);
    const thisWeekRevenue = thisWeek.reduce((s, o) => s + (o.total || 0), 0);
    const lastWeekRevenue = lastWeek.reduce((s, o) => s + (o.total || 0), 0);

    const avgOrderValue = delivered.length ? totalRevenue / delivered.length : 0;
    const conversionRate = allOrders.length
      ? Math.round((delivered.length / allOrders.length) * 1000) / 10
      : 0;

    // Trend helpers (percentage change, returns null when previous period is zero)
    const pctChange = (curr: number, prev: number) => {
      if (prev === 0) return curr === 0 ? 0 : 100;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };

    const recentOrders = allOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          todayRevenue,
          todayOrders: todayOrders.length,
          pendingOrders: pending.length,
          totalOrders: allOrders.length,
          totalRevenue,
          avgOrderValue,
          conversionRate,
        },
        trends: {
          revenue: pctChange(todayRevenue, yesterdayRevenue),
          orders: pctChange(todayOrders.length, yesterdayOrders.length),
          weeklyRevenue: pctChange(thisWeekRevenue, lastWeekRevenue),
          weeklyOrders: pctChange(thisWeek.length, lastWeek.length),
        },
        rating: seller?.performance?.rating || 0,
        totalRatings: seller?.performance?.totalRatings || 0,
        recentOrders,
        topProducts,
      },
    });
  } catch (error) {
    console.error('Seller dashboard error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}
