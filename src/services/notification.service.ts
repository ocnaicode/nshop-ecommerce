// =============================================================================
// Notification Service - Event-driven notification system
// Supports in-app, email-ready, SMS-ready, WhatsApp-ready channels
// =============================================================================

import dbConnect from '@/lib/db';
import { Notification } from '@/models/index';

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

    for (const channel of channels) {
      // In-app notification (always saved to database)
      if (channel === 'in_app') {
        await Notification.create({
          userId: payload.userId,
          type: payload.event,
          title: template.title,
          message: template.message(payload.data),
          data: payload.data,
          channel: 'in_app',
          isRead: false,
        });
      }

      // SMS-ready (log for now, integrate provider later)
      if (channel === 'sms') {
        console.log(`[SMS Notification] To: ${payload.userId}, Event: ${payload.event}, Message: ${template.message(payload.data)}`);
        // TODO: Integrate SMS provider (e.g., SSL Wireless, Mim SMS)
      }

      // Email-ready (log for now, integrate provider later)
      if (channel === 'email') {
        console.log(`[Email Notification] To: ${payload.userId}, Subject: ${template.title}, Body: ${template.message(payload.data)}`);
        // TODO: Integrate email provider (e.g., SendGrid, SES)
      }

      // WhatsApp-ready (log for now)
      if (channel === 'whatsapp') {
        console.log(`[WhatsApp Notification] To: ${payload.userId}, Message: ${template.message(payload.data)}`);
        // TODO: Integrate WhatsApp Business API
      }
    }
  } catch (error) {
    console.error('Notification error:', error);
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

export async function getUnreadCount(userId: string) {
  await dbConnect();
  return Notification.countDocuments({ userId, isRead: false });
}
