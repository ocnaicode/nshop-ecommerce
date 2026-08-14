import { NextRequest, NextResponse } from 'next/server';
import { processWebhook } from '@/services/payment.service';

/**
 * Gateway webhook/IPN endpoint. Handles callbacks from bKash, Nagad and
 * SSLCommerz. In production, gateways send these server-to-server; the
 * payload is validated by each provider's service.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await params;
    if (!['bkash', 'nagad', 'sslcommerz'].includes(provider)) {
      return NextResponse.json({ success: false, error: 'Unknown provider' }, { status: 404 });
    }

    const payload = await request.json().catch(() => {
      // SSLCommerz IPNs can arrive as form-encoded
      return Object.fromEntries(new URLSearchParams(request.url.split('?')[1] || ''));
    });

    const result = await processWebhook(provider as 'bkash' | 'nagad' | 'sslcommerz', payload as Record<string, unknown>);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 });
  }
}
