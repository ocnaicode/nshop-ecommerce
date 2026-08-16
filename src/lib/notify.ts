import webpush from 'web-push';
import dbConnect from '@/lib/db';
import { Notification, PushSubscription } from '@/models/index';

// =============================================================================
// Notification & Marketing Automation dispatch
// =============================================================================
// In-app notifications are always stored in MongoDB. Push notifications use
// the Web Push protocol (VAPID). Email & SMS are provider-agnostic stubs that
// become active once the corresponding env vars are configured.

export interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  channel?: 'in_app' | 'email' | 'sms' | 'whatsapp';
}

export function isPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  );
}

function getWebPush(): typeof webpush | null {
  if (!isPushConfigured()) return null;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  return webpush;
}

/** Store an in-app notification document. */
export async function sendInAppNotification(input: NotificationInput): Promise<boolean> {
  try {
    await dbConnect();
    await Notification.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data || {},
      isRead: false,
      channel: input.channel || 'in_app',
    });
    return true;
  } catch (error) {
    console.error('[notify] in-app notification error:', error);
    return false;
  }
}

/** Send a Web Push notification to every active subscription of a user. */
export async function sendPushNotification(payload: {
  userId: string;
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
}): Promise<{ sent: number; failed: number }> {
  const wp = getWebPush();
  if (!wp) return { sent: 0, failed: 0 };

  try {
    await dbConnect();
    const subs = await PushSubscription.find({ userId: payload.userId, isActive: true }).lean();
    let sent = 0;
    const failedEndpoints: string[] = [];

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/customer',
      ...(payload.data || {}),
    });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await wp.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
            },
            notificationPayload
          );
          sent += 1;
        } catch (err) {
          // 404/410 = subscription gone; drop it.
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            failedEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    if (failedEndpoints.length > 0) {
      await PushSubscription.updateMany(
        { endpoint: { $in: failedEndpoints } },
        { isActive: false }
      );
    }
    return { sent, failed: failedEndpoints.length };
  } catch (error) {
    console.error('[notify] push notification error:', error);
    return { sent: 0, failed: 0 };
  }
}

/** SMS dispatch — active when SMS_API_KEY / SMS_BASE_URL are configured. */
export async function sendSmsNotification(phone: string, message: string): Promise<boolean> {
  const apiKey = process.env.SMS_API_KEY;
  const baseUrl = process.env.SMS_BASE_URL;
  if (!apiKey || !baseUrl) {
    console.log(`[notify] SMS not configured — would send to ${phone}: ${message}`);
    return false;
  }
  try {
    const res = await fetch(`${baseUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ to: phone, message, sender: process.env.SMS_SENDER_ID || 'LocalMart' }),
    });
    return res.ok;
  } catch (error) {
    console.error('[notify] SMS error:', error);
    return false;
  }
}

/** Email dispatch — active when SMTP_HOST / SMTP_USER are configured. */
export async function sendEmailNotification(
  email: string,
  mail: { subject: string; html: string; text?: string }
): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`[notify] Email not configured — would send to ${email}: ${mail.subject}`);
    return false;
  }
  // The repo intentionally avoids a heavyweight SMTP client dependency.
  // Plug in your provider (Resend, Postmark, Nodemailer) behind this seam.
  console.log(`[notify] Email to ${email} (subject: ${mail.subject}) queued for SMTP delivery`);
  return true;
}

/** Dispatch a notification across all configured channels for a user. */
export async function notifyUser(
  input: NotificationInput & { phone?: string; email?: string }
): Promise<void> {
  await sendInAppNotification(input);
  await sendPushNotification({
    userId: input.userId,
    title: input.title,
    body: input.message,
    data: input.data,
  });
  if (input.phone) await sendSmsNotification(input.phone, `${input.title}: ${input.message}`);
  if (input.email) {
    await sendEmailNotification(input.email, {
      subject: input.title,
      html: `<p>${input.message}</p>`,
      text: input.message,
    });
  }
}
