import dbConnect from '@/lib/db';
import { Order } from '@/models/Order';
import { getSession } from '@/lib/auth';
import { csvResponse } from '@/services/export.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return new Response('Unauthorized', { status: 401 });

    const query: Record<string, unknown> = {};
    if (session.role === 'customer') query.customerId = session.id;
    else if (session.role === 'seller' && session.sellerId) query.sellerId = session.sellerId;
    else if (!['super_admin', 'admin', 'finance_manager'].includes(session.role)) {
      return new Response('Forbidden', { status: 403 });
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(2000).lean();

    const rows = orders.map((o: any) => ({
      orderNumber: o.orderNumber,
      customer: o.snapshots?.customer?.name || '',
      phone: o.snapshots?.customer?.phone || '',
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      subtotal: o.subtotal,
      deliveryFee: o.deliveryFee,
      discount: o.discount || 0,
      total: o.total,
      createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : '',
    }));

    return csvResponse('localmart-orders.csv', rows, [
      { key: 'orderNumber', label: 'Order Number' },
      { key: 'customer', label: 'Customer' },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status' },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'paymentStatus', label: 'Payment Status' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'deliveryFee', label: 'Delivery Fee' },
      { key: 'discount', label: 'Discount' },
      { key: 'total', label: 'Total' },
      { key: 'createdAt', label: 'Date' },
    ]);
  } catch (error) {
    console.error('Export orders error:', error);
    return new Response('Export failed', { status: 500 });
  }
}
