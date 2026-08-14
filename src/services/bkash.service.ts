// =============================================================================
// bKash Payment Gateway Service
// Implements the bKash Checkout (tokenized) flow:
//   1. grantToken()   - obtain API token with app credentials
//   2. createPayment() - create a payment request (returns bkashURL)
//   3. executePayment() - confirm payment using paymentID
// Falls back to a sandbox simulation when BKASH_* credentials are missing.
// =============================================================================

export interface BkashPaymentRequest {
  amount: number;
  orderId: string;
  customerMsisdn?: string;
  intent?: string;
  currency?: string;
  merchantInvoiceNumber?: string;
}

export interface BkashPaymentResult {
  success: boolean;
  paymentID?: string;
  transactionID?: string;
  bkashURL?: string;
  status?: string;
  error?: string;
  simulated?: boolean;
}

const BASE_URL = (() => {
  const mode = process.env.BKASH_ENV || 'sandbox';
  return mode === 'production'
    ? 'https://tokenized.pay.bka.sh/v1.2.0-beta'
    : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';
})();

const credentials = {
  username: process.env.BKASH_USERNAME || '',
  password: process.env.BKASH_PASSWORD || '',
  appKey: process.env.BKASH_APP_KEY || '',
  appSecret: process.env.BKASH_APP_SECRET || '',
};

export function isBkashConfigured(): boolean {
  return Boolean(credentials.appKey && credentials.appSecret);
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function grantToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const res = await fetch(`${BASE_URL}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      app_key: credentials.appKey,
      app_secret: credentials.appSecret,
    }),
  });

  if (!res.ok) throw new Error(`bKash token grant failed: ${res.status}`);
  const data = await res.json();
  if (!data.id_token) throw new Error('bKash token grant returned no token');

  cachedToken = { token: data.id_token, expiresAt: Date.now() + 55 * 60 * 1000 };
  return data.id_token;
}

/** Simulated sandbox response used when credentials are not configured */
function simulatedResult(amount: number, orderId: string): BkashPaymentResult {
  return {
    success: true,
    paymentID: `sim-bkash-${Date.now()}`,
    bkashURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments/simulate?provider=bkash&orderId=${orderId}&amount=${amount}`,
    status: 'Initiated',
    simulated: true,
  };
}

export async function bkashCreatePayment(req: BkashPaymentRequest): Promise<BkashPaymentResult> {
  if (!isBkashConfigured()) {
    console.log('[bkash] Credentials not configured — using simulation');
    return simulatedResult(req.amount, req.orderId);
  }

  try {
    const token = await grantToken();
    const res = await fetch(`${BASE_URL}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: token,
        'X-APP-Key': credentials.appKey,
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: req.customerMsisdn || '+8801XXXXXXXXX',
        callbackURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/webhook/bkash`,
        amount: req.amount.toFixed(2),
        currency: req.currency || 'BDT',
        intent: req.intent || 'sale',
        merchantInvoiceNumber: req.merchantInvoiceNumber || req.orderId,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.paymentID) {
      return { success: false, error: data.statusMessage || data.errorMessage || `bKash create failed (${res.status})` };
    }
    return { success: true, paymentID: data.paymentID, bkashURL: data.bkashURL, status: data.status };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function bkashExecutePayment(paymentID: string): Promise<BkashPaymentResult> {
  if (!isBkashConfigured()) {
    return { success: true, transactionID: `SIM${Date.now()}`, status: 'Completed', simulated: true };
  }

  try {
    const token = await grantToken();
    const res = await fetch(`${BASE_URL}/tokenized/checkout/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: token,
        'X-APP-Key': credentials.appKey,
      },
      body: JSON.stringify({ paymentID }),
    });

    const data = await res.json();
    if (!res.ok || data.transactionStatus !== 'Completed') {
      return { success: false, error: data.statusMessage || 'bKash payment not completed' };
    }
    return {
      success: true,
      paymentID: data.paymentID,
      transactionID: data.trxID,
      status: data.transactionStatus,
    };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function bkashQueryPayment(paymentID: string): Promise<BkashPaymentResult> {
  if (!isBkashConfigured()) {
    return { success: true, paymentID, status: 'Completed', simulated: true };
  }
  try {
    const token = await grantToken();
    const res = await fetch(`${BASE_URL}/tokenized/checkout/payment/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: token,
        'X-APP-Key': credentials.appKey,
      },
      body: JSON.stringify({ paymentID }),
    });
    const data = await res.json();
    return {
      success: res.ok,
      paymentID: data.paymentID,
      transactionID: data.trxID,
      status: data.transactionStatus,
      error: data.statusMessage,
    };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
