import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Payment } from '@/models/index';
import { Order } from '@/models/Order';
import { verifyGatewayPayment } from '@/lib/payments';
import { NOTIFICATION_EVENTS } from '@/config/constants';
import { notifyUser } from '@/lib/notify';

export const dynamic = 'force-dynamic';

// GET|POST /api/payments/[method]/callback
// Entry point the gateway redirects (or POSTs) to after payment. Verifies the
// transaction with the gateway and marks the order/payment as paid.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ method: string }> }
) {
  return handleCallback(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ method: string }> }
) {
  return handleCallback(request, await params);
}

async function handleCallback(request: NextRequest, { method }: { method: string }) {
  try {
    await dbConnect();

    // Gateways may send params as query string (GET) or form body (POST).
    const searchParams = new URL(request.url).searchParams;
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => { params[key] = value; });

    if (request.method === 'POST') {
      try {
        const form = await request.formData();
        form.forEach((value, key) => { params[key] = String(value); });
      } catch {
        try {
          const json = await request.json();
          Object.assign(params, json);
        } catch { /* no body */ }
      }
    }

    const verification = await verifyGatewayPayment(method, params);
    if (!verification.success) {
      // Show a friendly failure page (plain HTML so any browser renders it).
      return new NextResponse(
        renderPage('Payment Failed', 'The payment could not be verified. Please try again or contact support.'),
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Find the payment by gateway transaction id or order number.
    const orderNumber =
      params.tran_id || params.merchantInvoiceNumber || params.orderNumber;
    const query: Record<string, unknown> = { method };
    if (orderNumber) query.orderNumber = orderNumber;
    else if (verification.transactionId) query.transactionId = verification.transactionId;

    const payment = orderNumber
      ? await Payment.findOne({ orderId: (await Order.findOne({ orderNumber }).select('_id').lean())?._id })
      : await Payment.findOne({ ...query, transactionId: verification.transactionId });

    if (payment) {
      await Payment.updateOne(
        { _id: payment._id },
        {
          $set: {
            status: 'paid',
            transactionId: verification.transactionId || payment.transactionId,
            gatewayResponse: { verifiedAt: new Date().toISOString(), ...params },
          },
        }
      );

      const order = await Order.findById(payment.orderId).populate('customerId', 'name phone email').lean();
      if (order) {
        await Order.updateOne(
          { _id: order._id },
          {
            $set: {
              paymentStatus: 'paid',
              paymentId: payment._id,
            },
            $push: {
              timeline: {
                status: 'payment_success',
                description: `Payment completed via ${method}`,
                timestamp: new Date(),
                actorRole: 'system',
              },
            },
          }
        );

        const customer = order.customerId as { phone?: string; email?: string } | null;
        await notifyUser({
          userId: String(order.customerId._id || order.customerId),
          type: NOTIFICATION_EVENTS.PAYMENT_SUCCESS,
          title: 'Payment Successful',
          message: `Your payment of ৳${order.total} for order ${order.orderNumber} was successful.`,
          phone: customer?.phone,
          email: customer?.email,
        });
      }
    }

    // Redirect the customer to their order page.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const orderDoc = payment
      ? await Order.findById(payment.orderId).select('_id').lean()
      : null;
    const redirectTo = orderDoc ? `${appUrl}/customer/orders/${orderDoc._id}?paid=1` : `${appUrl}/customer/orders`;
    return NextResponse.redirect(redirectTo, 302);
  } catch (error) {
    console.error('Payment callback error:', error);
    return new NextResponse(
      renderPage('Payment Error', 'An unexpected error occurred while processing your payment.'),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

function renderPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — LocalMart</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f9fafb; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 40px; max-width: 420px; text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,.05); }
    h1 { font-size: 20px; margin: 0 0 8px; }
    p { color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; }
  </style>
</head>
<body><div class="card"><h1>${title}</h1><p>${message}</p></div></body>
</html>`;
}
