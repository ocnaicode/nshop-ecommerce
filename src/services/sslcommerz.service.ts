// =============================================================================
// SSLCommerz Payment Gateway Service
// Implements the SSLCommerz hosted checkout flow:
//   1. initSession()  - create a payment session, returns GatewayPageURL
//   2. validateIpn()  - verify the IPN (Instant Payment Notification) payload
// Falls back to a sandbox simulation when SSLCOMMERZ_* credentials are missing.
// =============================================================================

export interface SslcommerzPaymentRequest {
  amount: number;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerCity?: string;
  customerPostCode?: string;
  customerCountry?: string;
}

export interface SslcommerzPaymentResult {
  success: boolean;
  sessionKey?: string;
  gatewayPageURL?: string;
  transactionId?: string;
  status?: string;
  error?: string;
  simulated?: boolean;
}

const BASE_URL = (() => {
  const mode = process.env.SSLCOMMERZ_ENV || 'sandbox';
  return mode === 'production'
    ? 'https://securepay.sslcommerz.com'
    : 'https://sandbox.sslcommerz.com';
})();

const credentials = {
  storeId: process.env.SSLCOMMERZ_STORE_ID || '',
  storePass: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
};

export function isSslcommerzConfigured(): boolean {
  return Boolean(credentials.storeId && credentials.storePass);
}

function simulatedResult(amount: number, orderId: string): SslcommerzPaymentResult {
  return {
    success: true,
    sessionKey: `sim-sslcz-${Date.now()}`,
    gatewayPageURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments/simulate?provider=sslcommerz&orderId=${orderId}&amount=${amount}`,
    status: 'Initiated',
    simulated: true,
  };
}

export async function sslcommerzInitSession(req: SslcommerzPaymentRequest): Promise<SslcommerzPaymentResult> {
  if (!isSslcommerzConfigured()) {
    console.log('[sslcommerz] Credentials not configured — using simulation');
    return simulatedResult(req.amount, req.orderId);
  }

  try {
    const body = new URLSearchParams({
      store_id: credentials.storeId,
      store_passwd: credentials.storePass,
      total_amount: req.amount.toFixed(2),
      currency: 'BDT',
      tran_id: req.orderId,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/webhook/sslcommerz`,
      fail_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/webhook/sslcommerz`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/webhook/sslcommerz`,
      cus_name: req.customerName,
      cus_phone: req.customerPhone,
      cus_email: req.customerEmail || 'customer@example.com',
      cus_add1: req.customerAddress || 'N/A',
      cus_city: req.customerCity || 'Dhaka',
      cus_postcode: req.customerPostCode || '1000',
      cus_country: req.customerCountry || 'Bangladesh',
      shipping_method: 'NO',
      product_name: 'LocalMart Order',
      product_category: 'Ecommerce',
      product_profile: 'general',
    });

    const res = await fetch(`${BASE_URL}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = await res.json();
    if (!res.ok || data.status !== 'SUCCESS' || !data.GatewayPageURL) {
      return { success: false, error: data.failedreason || `SSLCommerz init failed (${res.status})` };
    }
    return {
      success: true,
      sessionKey: data.sessionkey,
      gatewayPageURL: data.GatewayPageURL,
      status: data.status,
    };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Validates the SSLCommerz IPN. In production this should re-verify
 * transaction status with the gateway using val_id.
 */
export async function sslcommerzValidateIpn(payload: Record<string, unknown>): Promise<{ valid: boolean; valId?: string; amount?: number; tranId?: string }> {
  const status = payload.status as string;
  const valId = payload.val_id as string | undefined;
  const tranId = payload.tran_id as string | undefined;
  const amount = Number(payload.amount);

  if (status !== 'VALID' || !valId) {
    return { valid: false };
  }

  if (!isSslcommerzConfigured()) {
    return { valid: true, valId, tranId, amount };
  }

  try {
    const body = new URLSearchParams({
      val_id: valId,
      store_id: credentials.storeId,
      store_passwd: credentials.storePass,
      format: 'json',
    });
    const res = await fetch(`${BASE_URL}/validator/api/validationserverAPI.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await res.json();
    const valid = res.ok && data.status === 'VALID' && Number(data.amount) === amount;
    return { valid, valId, tranId, amount };
  } catch {
    return { valid: false };
  }
}
