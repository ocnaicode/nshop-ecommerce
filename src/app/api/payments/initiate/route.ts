import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { initiatePayment, isSupportedPaymentMethod } from '@/services/payment.service';
import { trackAnalyticsEvent } from '@/services/analytics.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { orderId, method } = body as { orderId?: string; method?: string };

    if (!orderId) return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    if (!method || !isSupportedPaymentMethod(method)) {
      return NextResponse.json({ success: false, error: 'Invalid payment method' }, { status: 400 });
    }

    const result = await initiatePayment(orderId, method, {
      id: session.id,
      name: session.name,
      phone: session.phone,
      email: session.email,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to initiate payment' }, { status: 400 });
    }

    await trackAnalyticsEvent({
      userId: session.id,
      event: 'payment_initiated',
      data: { method, orderId, simulated: !!result.simulated },
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error('Payment initiate error:', error);
    return NextResponse.json({ success: false, error: 'Failed to initiate payment' }, { status: 500 });
  }
}
