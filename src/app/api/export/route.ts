import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { getSession, isAdmin } from '@/lib/auth';
import { Seller } from '@/models/Seller';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'orders';

    let csvContent = '';
    let filename = '';

    if (type === 'orders') {
      const query: any = {};
      if (session.role === 'seller') query.sellerId = session.sellerId;
      const orders = await Order.find(query).sort({ createdAt: -1 }).limit(1000).lean();
      csvContent = 'Order Number,Customer,Status,Payment,Total,Date\n';
      orders.forEach(o => { csvContent += `${o.orderNumber},${o.snapshots?.customer?.name || ''},${o.status},${o.paymentMethod},${o.total},${o.createdAt}\n`; });
      filename = 'orders.csv';
    } else if (type === 'products') {
      const query: any = {};
      if (session.role === 'seller') query.sellerId = session.sellerId;
      const products = await Product.find(query).lean();
      csvContent = 'Name,SKU,Price,Stock,Status\n';
      products.forEach(p => { csvContent += `"${p.name}",${p.sku},${p.price},${p.stock},${p.status}\n`; });
      filename = 'products.csv';
    } else {
      return NextResponse.json({ success: false, error: 'Invalid export type' }, { status: 400 });
    }

    return new NextResponse(csvContent, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${filename}"` },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Export failed' }, { status: 500 });
  }
}
