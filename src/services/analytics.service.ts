// =============================================================================
// Analytics Service - aggregation queries for the analytics dashboard
// Uses cached aggregation for performance (see cache.service).
// =============================================================================

import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Order } from '@/models/Order';
import { User } from '@/models/User';
import { Seller } from '@/models/Seller';
import { Shop } from '@/models/Shop';
import { Product } from '@/models/Product';
import { Payment, AnalyticsEvent, Review } from '@/models/index';
import { cached } from './cache.service';

export interface OverviewStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalSellers: number;
  totalShops: number;
  avgOrderValue: number;
  pendingOrders: number;
  deliveredOrders: number;
  paidPayments: number;
  totalPayments: number;
  revenueToday: number;
  ordersToday: number;
  newUsersThisMonth: number;
}

export interface TimeSeriesPoint {
  date: string;
  orders: number;
  revenue: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  count: number;
  amount: number;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  await dbConnect();

  const key = 'analytics:overview';
  const loader = async (): Promise<OverviewStats> => {
    const [revenueAgg, orderStats, userCount, sellerCount, shopCount, todayAgg, newUsers] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'returned'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $group: { _id: null, count: { $sum: 1 }, pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }, delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } } } },
      ]),
      User.countDocuments({ role: 'customer' }),
      Seller.countDocuments({ status: { $in: ['approved', 'active'] } }),
      Shop.countDocuments(),
      Order.aggregate([
        { $match: { createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }, status: { $nin: ['cancelled', 'returned'] } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      User.countDocuments({ role: 'customer', createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }),
    ]);

    const [paymentAgg] = await Payment.aggregate([
      { $group: { _id: null, paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } }, count: { $sum: 1 } } },
    ]);

    const revenue = revenueAgg[0]?.total || 0;
    const orders = orderStats[0]?.count || 0;

    return {
      totalRevenue: revenue,
      totalOrders: orders,
      totalUsers: userCount,
      totalSellers: sellerCount,
      totalShops: shopCount,
      avgOrderValue: orders > 0 ? Math.round(revenue / orders) : 0,
      pendingOrders: orderStats[0]?.pending || 0,
      deliveredOrders: orderStats[0]?.delivered || 0,
      paidPayments: paymentAgg?.paid || 0,
      totalPayments: paymentAgg?.count || 0,
      revenueToday: todayAgg[0]?.revenue || 0,
      ordersToday: todayAgg[0]?.count || 0,
      newUsersThisMonth: newUsers,
    };
  };

  return cached(key, loader, 60);
}

export async function getRevenueTimeseries(days = 14): Promise<TimeSeriesPoint[]> {
  await dbConnect();
  const key = `analytics:timeseries:${days}`;

  return cached(key, async () => {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const rows = await Order.aggregate<{ _id: string; orders: number; revenue: number }>([
      { $match: { createdAt: { $gte: since }, status: { $nin: ['cancelled', 'returned'] } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days with zeros
    const map = new Map(rows.map((r) => [r._id, r]));
    const points: TimeSeriesPoint[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const row = map.get(iso);
      points.push({
        date: iso,
        orders: row?.orders || 0,
        revenue: row?.revenue || 0,
      });
    }
    return points;
  }, 120);
}

export async function getTopProducts(limit = 10): Promise<TopProduct[]> {
  await dbConnect();
  const key = `analytics:top-products:${limit}`;

  return cached(key, async () => {
    const rows = await Order.aggregate<{ _id: string; quantity: number; revenue: number }>([
      { $unwind: '$items' },
      { $match: { status: { $nin: ['cancelled', 'returned'] } } },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
    ]);
    return rows.map((r) => ({ name: r._id, quantity: r.quantity, revenue: r.revenue }));
  }, 120);
}

export async function getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  await dbConnect();
  const key = 'analytics:categories';

  return cached(key, async () => {
    const rows = await Order.aggregate<{ _id: string; value: number }>([
      { $unwind: '$items' },
      { $match: { status: { $nin: ['cancelled', 'returned'] } } },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'cat',
        },
      },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$cat.name', 'Uncategorized'] },
          value: { $sum: '$items.quantity' },
        },
      },
      { $sort: { value: -1 } },
      { $limit: 8 },
    ]);
    return rows.map((r) => ({ name: r._id, value: r.value }));
  }, 300);
}

export async function getPaymentMethodSplit(): Promise<PaymentMethodBreakdown[]> {
  await dbConnect();
  const key = 'analytics:payment-methods';

  return cached(key, async () => {
    const rows = await Payment.aggregate<{ _id: string; count: number; amount: number }>([
      { $group: { _id: '$method', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
      { $sort: { amount: -1 } },
    ]);
    return rows.map((r) => ({ method: r._id, count: r.count, amount: r.amount }));
  }, 300);
}

export async function getSellerPerformance(sellerId: string) {
  await dbConnect();
  const key = `analytics:seller:${sellerId}`;

  return cached(key, async () => {
    const sellerObjectId = mongoose.Types.ObjectId.createFromHexString(sellerId);
    const [orderAgg, productCount, recentOrders, reviewsAgg] = await Promise.all([
      Order.aggregate([
        { $match: { sellerId: sellerObjectId } },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          },
        },
      ]),
      Product.countDocuments({ sellerId }),
      Order.find({ sellerId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber total status createdAt')
        .lean(),
      Review.aggregate([
        { $match: { sellerId: sellerObjectId } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

    return {
      revenue: orderAgg[0]?.revenue || 0,
      orders: orderAgg[0]?.orders || 0,
      pendingOrders: orderAgg[0]?.pending || 0,
      productCount,
      avgRating: reviewsAgg[0]?.avg || 0,
      reviewCount: reviewsAgg[0]?.count || 0,
      recentOrders,
    };
  }, 120);
}

/** Logs an analytics event (page views, product views, searches, etc.) */
export async function trackAnalyticsEvent(payload: {
  userId?: string;
  sessionId?: string;
  event: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    await dbConnect();
    await AnalyticsEvent.create({
      userId: payload.userId ? mongoose.Types.ObjectId.createFromHexString(payload.userId) : undefined,
      sessionId: payload.sessionId || 'anonymous',
      event: payload.event,
      data: payload.data || {},
    });
  } catch (err) {
    console.error('[analytics] track failed:', (err as Error).message);
  }
}
