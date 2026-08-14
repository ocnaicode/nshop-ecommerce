// =============================================================================
// Email Service - SendGrid integration with graceful console fallback
// Sends transactional emails (order confirmation, OTP, etc.) when
// SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are configured.
// =============================================================================

interface EmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicData?: Record<string, unknown>;
  attachments?: { filename: string; content: string; type?: string }[];
}

let sendgridClient: any = null;

function getClient() {
  if (sendgridClient) return sendgridClient;
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return null;
  try {
    // Lazy dynamic import keeps the build free of provider requirements
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(apiKey);
    sendgridClient = sgMail;
    return sendgridClient;
  } catch (err) {
    console.warn('[email] SendGrid client init failed:', (err as Error).message);
    return null;
  }
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@localmart.app';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'LocalMart';

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; provider: 'sendgrid' | 'console' }> {
  const client = getClient();
  if (!client) {
    // Graceful fallback: log the email instead of failing
    console.log('[email:console]', JSON.stringify(payload, null, 2));
    return { success: true, provider: 'console' };
  }

  try {
    await client.send({
      to: payload.to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: payload.subject,
      html: payload.html || `<p>${payload.text || ''}</p>`,
      text: payload.text,
      templateId: payload.templateId,
      dynamicTemplateData: payload.dynamicData,
      attachments: payload.attachments,
    });
    return { success: true, provider: 'sendgrid' };
  } catch (err) {
    console.error('[email] SendGrid send failed:', (err as Error).message);
    return { success: false, provider: 'sendgrid' };
  }
}

// =============================================================================
// Ready-made templates
// =============================================================================

export function orderConfirmationEmail(orderNumber: string, customerName: string, total: number): EmailPayload {
  return {
    to: '', // caller sets the recipient
    subject: `Order ${orderNumber} confirmed — LocalMart`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #16a34a;">Thank you, ${customerName}! 🎉</h2>
        <p>Your order <strong>${orderNumber}</strong> has been placed successfully.</p>
        <p>Order total: <strong>৳${total}</strong></p>
        <p>Track your order anytime from your LocalMart dashboard.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 12px;">LocalMart — All local shops in one place</p>
      </div>
    `,
  };
}

export function otpEmail(otp: string): EmailPayload {
  return {
    to: '',
    subject: 'Your LocalMart verification code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #16a34a;">LocalMart</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp}</p>
        <p>This code expires in 10 minutes. Never share it with anyone.</p>
      </div>
    `,
  };
}

export function referralRewardEmail(rewardAmount: number, referredName: string): EmailPayload {
  return {
    to: '',
    subject: `You earned ৳${rewardAmount} from your referral!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #16a34a;">Referral reward unlocked 🎉</h2>
        <p>${referredName} placed their first order using your referral code.</p>
        <p>You earned <strong>৳${rewardAmount}</strong> in referral credit!</p>
      </div>
    `,
  };
}
