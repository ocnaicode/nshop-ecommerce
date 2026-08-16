import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Payment } from '@/models/index';
import { Order } from '@/models/Order';
import { getSession } from '@/lib/auth';
import { initiateGatewayPayment, isPaymentMethodEnabled, type SupportedPaymentMethod } from '@/lib/payments';

export const dynamic = 'force-dynamic';

// POST /api/payments/[method]/initiate
// Creates a gateway session for an existing pending order and stores the
// gateway transaction id on the Payment record.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ method: string }> }
) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { method } = await params;
    if (!isPaymentMethodEnabled(method)) {
      return NextResponse.json(
        { success: false, error: 'Payment gateway is not enabled' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const orderId = body.orderId as string;
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }

    const order = await Order.findOne({
      _id: orderId,
      customerId: session.id,
      paymentStatus: { $in: ['pending', 'authorized'] },
    });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const result = await initiateGatewayPayment({
      method: method as SupportedPaymentMethod,
      amount: order.total,
      orderNumber: order.orderNumber,
      customer: {
        name: order.snapshots?.customer?.name || session.name,
        phone: order.snapshots?.customer?.phone || session.phone,
      },
      productName: order.items[0]?.name || 'LocalMart Order',
      returnUrl: `${appUrl}/api/payments/${method}/callback`,
      callbackUrl: `${appUrl}/api/payments/${method}/callback`,
    });

    if (result.transactionId) {
      await Payment.findOneAndUpdate(
        { orderId: order._id, method },
        {
          $set: {
            transactionId: result.transactionId,
            gatewayResponse: { initiatedAt: new Date().toISOString(), status: result.status },
          },
        }
      );
    }

    return NextResponse.json({
      success: result.status !== 'unavailable',
      data: {
        paymentUrl: result.gatewayUrl || null,
        transactionId: result.transactionId || null,
        status: result.status,
        orderId: order._id,
      },
    });
  } catch (error) {
    console.error('Payment initiate error:', error);
    return NextResponse.json({ success: false, error: 'Failed to initiate payment' }, { status: 500 });
  }
}
