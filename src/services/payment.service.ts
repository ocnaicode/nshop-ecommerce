// =============================================================================
// Payment Service - Orchestrates payment gateways (bKash, Nagad, SSLCommerz, COD)
// Handles payment initiation, verification, webhook processing and refunds.
// =============================================================================

import dbConnect from '@/lib/db';
import { Order } from '@/models/Order';
import { Payment, SellerWallet, WalletTransaction } from '@/models/index';
import { User } from '@/models/User';
import { sendNotification } from './notification.service';
import { earnPoints } from './loyalty.service';
import { bkashCreatePayment, bkashExecutePayment } from './bkash.service';
import { nagadInitializePayment, nagadVerifyPayment } from './nagad.service';
import { sslcommerzInitSession, sslcommerzValidateIpn } from './sslcommerz.service';

export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'sslcommerz';

export const SUPPORTED_PAYMENT_METHODS: PaymentMethod[] = ['cod', 'bkash', 'nagad', 'sslcommerz'];

export function isSupportedPaymentMethod(method: string): method is PaymentMethod {
  return SUPPORTED_PAYMENT_METHODS.includes(method as PaymentMethod);
}

export interface InitiatePaymentResult {
  success: boolean;
  requiresRedirect?: boolean;
  redirectUrl?: string;
  payment?: any;
  error?: string;
  simulated?: boolean;
}

/**
 * Initiates a payment for an order.
 * - COD: marks payment as pending, nothing to do.
 * - Online gateways: creates a gateway session and returns the redirect URL.
 */
export async function initiatePayment(
  orderId: string,
  method: PaymentMethod,
  session: { id: string; name: string; phone: string; email?: string }
): Promise<InitiatePaymentResult> {
  await dbConnect();

  const order = await Order.findById(orderId);
  if (!order) return { success: false, error: 'Order not found' };

  let payment = await Payment.findOne({ orderId: order._id });
  if (!payment) {
    payment = await Payment.create({
      orderId: order._id,
      customerId: order.customerId,
      sellerId: order.sellerId,
      method,
      amount: order.total,
      status: 'pending',
    });
  }

  if (method === 'cod') {
    return { success: true, payment };
  }

  if (method === 'bkash') {
    const result = await bkashCreatePayment({
      amount: order.total,
      orderId: order.orderNumber,
      customerMsisdn: `+88${session.phone.replace(/^0/, '')}`,
      merchantInvoiceNumber: order.orderNumber,
    });
    if (!result.success) return { success: false, error: result.error };

    payment.transactionId = result.paymentID;
    payment.gatewayResponse = { paymentID: result.paymentID, status: result.status, simulated: result.simulated };
    await payment.save();

    return {
      success: true,
      requiresRedirect: true,
      redirectUrl: result.bkashURL,
      payment,
      simulated: result.simulated,
    };
  }

  if (method === 'nagad') {
    const result = await nagadInitializePayment({
      amount: order.total,
      orderId: order.orderNumber,
      customerPhone: session.phone,
    });
    if (!result.success) return { success: false, error: result.error };

    payment.transactionId = result.paymentReferenceId;
    payment.gatewayResponse = { paymentReferenceId: result.paymentReferenceId, status: result.status, simulated: result.simulated };
    await payment.save();

    return {
      success: true,
      requiresRedirect: true,
      redirectUrl: result.callbackUrl,
      payment,
      simulated: result.simulated,
    };
  }

  if (method === 'sslcommerz') {
    const user = await User.findById(session.id).lean();
    const result = await sslcommerzInitSession({
      amount: order.total,
      orderId: order.orderNumber,
      customerName: session.name,
      customerPhone: session.phone,
      customerEmail: session.email || user?.email || undefined,
    });
    if (!result.success) return { success: false, error: result.error };

    payment.transactionId = result.sessionKey;
    payment.gatewayResponse = { sessionKey: result.sessionKey, status: result.status, simulated: result.simulated };
    await payment.save();

    return {
      success: true,
      requiresRedirect: true,
      redirectUrl: result.gatewayPageURL,
      payment,
      simulated: result.simulated,
    };
  }

  return { success: false, error: 'Unsupported payment method' };
}

/**
 * Marks a payment as paid after gateway confirmation.
 * Updates order, wallet (platform share → seller available balance),
 * sends notifications and awards loyalty points.
 */
export async function confirmPayment(
  paymentId: string,
  gatewayData?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  await dbConnect();

  const payment = await Payment.findById(paymentId);
  if (!payment) return { success: false, error: 'Payment not found' };
  if (payment.status === 'paid') return { success: true };

  payment.status = 'paid';
  payment.gatewayResponse = { ...(payment.gatewayResponse || {}), ...(gatewayData || {}) };
  await payment.save();

  const order = await Order.findById(payment.orderId);
  if (order) {
    order.paymentStatus = 'paid';
    await order.save();
  }

  // Seller wallet credit (order total − platform commission)
  if (order) {
    const sellerAmount = order.total - (order.commission || 0);
    const wallet = await SellerWallet.findOneAndUpdate(
      { sellerId: order.sellerId },
      { $inc: { availableBalance: sellerAmount, totalEarned: sellerAmount } },
      { new: true, upsert: true }
    );
    if (wallet) {
      await WalletTransaction.create({
        walletId: wallet._id,
        sellerId: order.sellerId,
        type: 'credit',
        amount: sellerAmount,
        description: `Payment received for order ${order.orderNumber}`,
        referenceId: order._id,
      });
    }
  }

  // Notifications (in-app + realtime via socket + email)
  await sendNotification({
    userId: payment.customerId.toString(),
    event: 'payment_success',
    data: { amount: payment.amount, orderNumber: order?.orderNumber },
    channels: ['in_app', 'email'],
  });

  // Loyalty points for customer
  await earnPoints(payment.customerId.toString(), payment.amount, order?._id.toString());

  return { success: true };
}

/** Processes a gateway webhook/IPN payload and resolves the matching payment */
export async function processWebhook(
  provider: 'bkash' | 'nagad' | 'sslcommerz',
  payload: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  await dbConnect();

  try {
    if (provider === 'bkash') {
      const paymentID = payload.paymentID as string;
      const status = payload.transactionStatus as string;
      if (!paymentID) return { success: false, error: 'Missing paymentID' };

      const payment = await Payment.findOne({ transactionId: paymentID });
      if (!payment) return { success: false, error: 'Payment not found' };

      if (status === 'Completed') {
        return confirmPayment(payment._id.toString(), payload);
      }
      return { success: false, error: `bKash status: ${status}` };
    }

    if (provider === 'nagad') {
      const referenceId = (payload.paymentReferenceId || payload.paymentRefId) as string;
      if (!referenceId) return { success: false, error: 'Missing paymentReferenceId' };

      const payment = await Payment.findOne({ transactionId: referenceId });
      if (!payment) return { success: false, error: 'Payment not found' };

      const verify = await nagadVerifyPayment(referenceId);
      if (verify.success) {
        return confirmPayment(payment._id.toString(), { ...payload, ...verify });
      }
      return { success: false, error: verify.error };
    }

    if (provider === 'sslcommerz') {
      const validation = await sslcommerzValidateIpn(payload);
      if (!validation.valid) return { success: false, error: 'Invalid IPN signature' };

      const payment = await Payment.findOne({ orderId: validation.tranId });
      const byTransaction = payment || (await Payment.findOne({ transactionId: validation.valId }));
      const resolved = byTransaction;
      if (!resolved) return { success: false, error: 'Payment not found' };

      return confirmPayment(resolved._id.toString(), { ...payload, val_id: validation.valId });
    }

    return { success: false, error: 'Unknown provider' };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/** Completes a gateway redirect (bKash execute after user returns) */
export async function completeGatewayRedirect(
  provider: 'bkash' | 'nagad' | 'sslcommerz',
  paymentID: string
): Promise<{ success: boolean; error?: string; simulated?: boolean }> {
  await dbConnect();

  if (provider === 'bkash') {
    const result = await bkashExecutePayment(paymentID);
    if (!result.success) return { success: false, error: result.error };
    const payment = await Payment.findOne({ transactionId: paymentID });
    if (!payment) return { success: false, error: 'Payment not found' };
    const confirmed = await confirmPayment(payment._id.toString(), { trxID: result.transactionID });
    return { ...confirmed, simulated: result.simulated };
  }

  if (provider === 'nagad') {
    const result = await nagadVerifyPayment(paymentID);
    if (!result.success) return { success: false, error: result.error };
    const payment = await Payment.findOne({ transactionId: paymentID });
    if (!payment) return { success: false, error: 'Payment not found' };
    const confirmed = await confirmPayment(payment._id.toString(), { trxID: result.transactionId });
    return { ...confirmed, simulated: result.simulated };
  }

  if (provider === 'sslcommerz') {
    const payment = await Payment.findOne({ transactionId: paymentID });
    if (!payment) return { success: false, error: 'Payment not found' };
    return confirmPayment(payment._id.toString(), {});
  }

  return { success: false, error: 'Unknown provider' };
}

export async function listPayments(query: Record<string, unknown>, page = 1, limit = 20) {
  await dbConnect();
  const [payments, total] = await Promise.all([
    Payment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('orderId', 'orderNumber total')
      .lean(),
    Payment.countDocuments(query),
  ]);
  return { payments, total };
}
