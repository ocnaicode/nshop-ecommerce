import { NextRequest, NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { listPayments } from '@/services/payment.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 20);
    const method = searchParams.get('method');
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (session.role === 'customer') query.customerId = session.id;
    else if (session.role === 'seller') query.sellerId = session.sellerId;
    else if (!isAdmin(session.role)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    if (method) query.method = method;
    if (status) query.status = status;

    const { payments, total } = await listPayments(query, page, limit);
    return NextResponse.json({
      success: true,
      data: payments,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Payments GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
  }
}
