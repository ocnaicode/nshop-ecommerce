import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { completeGatewayRedirect } from '@/services/payment.service';

/**
 * Completes a gateway redirect after the customer returns from the
 * payment page (bKash execute / Nagad verify / SSLCommerz IPN-resolved).
 * Used by the in-app simulation page as well as real gateway callbacks.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { provider, paymentId, paymentReferenceId } = body as {
      provider?: string;
      paymentId?: string;
      paymentReferenceId?: string;
    };

    if (!provider || !['bkash', 'nagad', 'sslcommerz'].includes(provider)) {
      return NextResponse.json({ success: false, error: 'Invalid provider' }, { status: 400 });
    }

    const id = paymentId || paymentReferenceId;
    if (!id) return NextResponse.json({ success: false, error: 'Payment reference required' }, { status: 400 });

    const result = await completeGatewayRedirect(provider as 'bkash' | 'nagad' | 'sslcommerz', id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Payment verification failed' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Payment verify error:', error);
    return NextResponse.json({ success: false, error: 'Failed to verify payment' }, { status: 500 });
  }
}
