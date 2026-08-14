// =============================================================================
// SMS Service - Twilio integration with graceful console fallback
// Sends SMS (OTP, order updates) when TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
// and TWILIO_PHONE_NUMBER are configured.
// =============================================================================

interface SmsPayload {
  to: string; // E.164 format, e.g. +8801XXXXXXXXX
  body: string;
}

let twilioClient: any = null;

function getClient() {
  if (twilioClient) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const twilio = require('twilio');
    twilioClient = twilio(sid, token);
    return twilioClient;
  } catch (err) {
    console.warn('[sms] Twilio client init failed:', (err as Error).message);
    return null;
  }
}

const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER || '';

export function isSmsConfigured(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
}

/** Normalizes a Bangladeshi phone number to E.164 for Twilio */
export function toE164(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('880')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+88${cleaned}`;
  return `+880${cleaned}`;
}

export async function sendSms(payload: SmsPayload): Promise<{ success: boolean; provider: 'twilio' | 'console' }> {
  const client = getClient();
  if (!client || !TWILIO_FROM) {
    console.log('[sms:console]', JSON.stringify({ to: payload.to, body: payload.body }));
    return { success: true, provider: 'console' };
  }

  try {
    await client.messages.create({
      from: TWILIO_FROM,
      to: payload.to,
      body: payload.body,
    });
    return { success: true, provider: 'twilio' };
  } catch (err) {
    console.error('[sms] Twilio send failed:', (err as Error).message);
    return { success: false, provider: 'twilio' };
  }
}

// =============================================================================
// Ready-made templates
// =============================================================================

export function otpSms(otp: string): string {
  return `Your LocalMart verification code is ${otp}. It expires in 10 minutes.`;
}

export function orderStatusSms(orderNumber: string, status: string): string {
  return `LocalMart: Your order ${orderNumber} is now ${status}. Track it in the app.`;
}

export function paymentSms(orderNumber: string, amount: number): string {
  return `LocalMart: Payment of ৳${amount} for order ${orderNumber} was successful. Thank you!`;
}
