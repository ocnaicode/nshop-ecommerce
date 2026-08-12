import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';
import { Seller } from '@/models/Seller';
import { getSession } from '@/lib/auth';
import { aiService } from '@/services/ai.service';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const seller = await Seller.findOne({ userId: session.id });
    if (!seller) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const [topProducts, lowStock, orders] = await Promise.all([
      Product.find({ sellerId: seller._id, status: 'active' }).sort({ totalSold: -1 }).limit(5).lean(),
      Product.find({ sellerId: seller._id, status: 'active', $expr: { $lte: ['$stock', '$lowStockThreshold'] } }).lean(),
      Order.find({ sellerId: seller._id, status: 'delivered' }).lean(),
    ]);
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    let aiInsights = '';
    if (aiService.isAvailable()) {
      const result = await aiService.generateSellerInsights({ totalSales: revenue, totalOrders: orders.length, topProducts: topProducts.map(p => p.name), lowStockProducts: lowStock.map(p => p.name), period: 'All time' });
      if (result.success) aiInsights = result.text || '';
    }
    return NextResponse.json({ success: true, data: { topProducts, lowStock, revenue, orders: orders.length, aiInsights } });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}
