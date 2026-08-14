// =============================================================================
// Notification Service - Event-driven notification system
// Channels: in-app (DB + realtime), email (SendGrid), SMS (Twilio), WhatsApp
// Email/SMS jobs are enqueued via the queue service (BullMQ or inline fallback).
// =============================================================================

import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { Notification } from '@/models/index';
import { orderConfirmationEmail, referralRewardEmail } from './email.service';
import { orderStatusSms, paymentSms, toE164 } from './sms.service';
import { emitRealtime } from '@/server/realtime';
import { enqueueJob } from './queue.service';

export type NotificationEvent =
  | 'order_created'
  | 'order_accepted'
  | 'order_ready'
  | 'rider_assigned'
  | 'order_picked_up'
  | 'order_delivered'
  | 'payment_success'
  | 'payment_failed'
  | 'refund_completed'
  | 'low_stock'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'referral_rewarded'
  | 'loyalty_rewarded'
  | 'new_order_for_seller'
  | 'order_cancelled';

interface NotificationPayload {
  userId: string;
  event: NotificationEvent;
  data?: Record<string, unknown>;
  channels?: ('in_app' | 'email' | 'sms' | 'whatsapp')[];
}

const notificationTemplates: Record<NotificationEvent, { title: string; message: (data?: Record<string, unknown>) => string }> = {
  order_created: {
    title: 'New Order',
    message: (data) => `Your order ${data?.orderNumber || ''} has been placed successfully.`,
  },
  order_accepted: {
    title: 'Order Accepted',
    message: (data) => `Your order ${data?.orderNumber || ''} has been accepted by the seller.`,
  },
  order_ready: {
    title: 'Order Ready',
    message: (data) => `Your order ${data?.orderNumber || ''} is ready!`,
  },
  rider_assigned: {
    title: 'Rider Assigned',
    message: () => 'A rider has been assigned to your delivery.',
  },
  order_picked_up: {
    title: 'Order Picked Up',
    message: () => 'Your order has been picked up by the rider.',
  },
  order_delivered: {
    title: 'Order Delivered',
    message: (data) => `Order ${data?.orderNumber || ''} has been delivered. Rate your experience!`,
  },
  payment_success: {
    title: 'Payment Successful',
    message: (data) => `Payment of ৳${data?.amount || 0} received successfully.`,
  },
  payment_failed: {
    title: 'Payment Failed',
    message: () => 'Your payment could not be processed. Please try again.',
  },
  refund_completed: {
    title: 'Refund Completed',
    message: (data) => `Refund of ৳${data?.amount || 0} has been processed.`,
  },
  low_stock: {
    title: 'Low Stock Alert',
    message: (data) => `${data?.productName || 'A product'} is running low on stock.`,
  },
  subscription_expiring: {
    title: 'Subscription Expiring',
    message: (data) => `Your ${data?.plan || ''} subscription expires in ${data?.days || 0} days.`,
  },
  subscription_expired: {
    title: 'Subscription Expired',
    message: () => 'Your subscription has expired. Renew to continue using premium features.',
  },
  referral_rewarded: {
    title: 'Referral Reward',
    message: (data) => `You earned ৳${data?.amount || 0} from your referral!`,
  },
  loyalty_rewarded: {
    title: 'Loyalty Points',
    message: (data) => `You earned ${data?.points || 0} loyalty points!`,
  },
  new_order_for_seller: {
    title: 'New Order Received',
    message: (data) => `New order ${data?.orderNumber || ''} received. Please process it.`,
  },
  order_cancelled: {
    title: 'Order Cancelled',
    message: (data) => `Order ${data?.orderNumber || ''} has been cancelled.`,
  },
};

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  try {
    await dbConnect();

    const template = notificationTemplates[payload.event];
    if (!template) return;

    const channels = payload.channels || ['in_app'];
    const title = template.title;
    const message = template.message(payload.data);

    for (const channel of channels) {
      // In-app notification (saved to database + pushed via socket)
      if (channel === 'in_app') {
        const notification = await Notification.create({
          userId: payload.userId,
          type: payload.event,
          title,
          message,
          data: payload.data,
          channel: 'in_app',
          isRead: false,
        });

        emitRealtime({
          userId: payload.userId,
          event: 'notification',
          data: {
            id: notification._id.toString(),
            type: payload.event,
            title,
            message,
            at: new Date().toISOString(),
          },
        });
      }

      // Email via SendGrid (queued)
      if (channel === 'email') {
        const email = buildEmailTemplate(payload.event, payload.data, title, message);
        if (email) {
          const user = await User.findById(payload.userId).select('email phone').lean();
          if (user?.email) {
            await enqueueJob({
              name: 'send-email',
              data: { ...email, to: user.email },
            });
          }
        }
      }

      // SMS via Twilio (queued)
      if (channel === 'sms') {
        const smsBody = buildSmsTemplate(payload.event, payload.data);
        if (smsBody) {
          const user = await User.findById(payload.userId).select('phone').lean();
          if (user?.phone) {
            await enqueueJob({
              name: 'send-sms',
              data: { to: toE164(user.phone), body: smsBody },
            });
          }
        }
      }

      // WhatsApp-ready (log for now)
      if (channel === 'whatsapp') {
        console.log(`[WhatsApp Notification] To: ${payload.userId}, Message: ${message}`);
      }
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
}

function buildEmailTemplate(
  event: NotificationEvent,
  data: Record<string, unknown> | undefined,
  title: string,
  message: string
): { subject: string; html: string } | null {
  const orderNumber = data?.orderNumber as string | undefined;
  const amount = data?.amount as number | undefined;

  switch (event) {
    case 'order_created': {
      const tpl = orderConfirmationEmail(orderNumber || '', 'there', amount || 0);
      return { subject: tpl.subject, html: tpl.html || '' };
    }
    case 'order_delivered':
      return { subject: title, html: `<p>${message}</p>` };
    case 'payment_success':
      return { subject: `Payment received — LocalMart`, html: `<p>${message}</p>` };
    case 'referral_rewarded': {
      const tpl = referralRewardEmail(amount || 0, (data?.referredName as string) || 'A friend');
      return { subject: tpl.subject, html: tpl.html || '' };
    }
    default:
      return { subject: title, html: `<p>${message}</p>` };
  }
}

function buildSmsTemplate(event: NotificationEvent, data: Record<string, unknown> | undefined): string | null {
  const orderNumber = (data?.orderNumber as string) || '';
  switch (event) {
    case 'order_created':
    case 'order_accepted':
    case 'order_ready':
    case 'order_picked_up':
    case 'order_delivered':
    case 'order_cancelled':
      return orderStatusSms(orderNumber, event.replace('order_', '').replace('_', ' '));
    case 'payment_success':
      return paymentSms(orderNumber, Number(data?.amount || 0));
    default:
      return null;
  }
}

export async function getUserNotifications(userId: string, limit = 20) {
  await dbConnect();
  return Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function markNotificationRead(notificationId: string) {
  await dbConnect();
  return Notification.findByIdAndUpdate(notificationId, { isRead: true });
}

export async function markAllNotificationsRead(userId: string) {
  await dbConnect();
  return Notification.updateMany({ userId, isRead: false }, { isRead: true });
}

export async function getUnreadCount(userId: string) {
  await dbConnect();
  return Notification.countDocuments({ userId, isRead: false });
}
