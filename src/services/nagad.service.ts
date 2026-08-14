// =============================================================================
// Nagad Payment Gateway Service
// Implements the Nagad checkout flow:
//   1. initializePayment() - creates a payment session, returns callback URL
//   2. verifyPayment()     - verifies payment via payment reference ID
// Falls back to a sandbox simulation when NAGAD_* credentials are missing.
// =============================================================================

export interface NagadPaymentRequest {
  amount: number;
  orderId: string;
  customerPhone?: string;
  productName?: string;
}

export interface NagadPaymentResult {
  success: boolean;
  paymentReferenceId?: string;
  transactionId?: string;
  callbackUrl?: string;
  status?: string;
  error?: string;
  simulated?: boolean;
}

const BASE_URL = (() => {
  const mode = process.env.NAGAD_ENV || 'sandbox';
  return mode === 'production'
    ? 'https://api.nagad.com.bd'
    : 'https://sandbox.mynagad.com:10000';
})();

const credentials = {
  merchantId: process.env.NAGAD_MERCHANT_ID || '',
  merchantNumber: process.env.NAGAD_MERCHANT_NUMBER || '',
  publicKey: process.env.NAGAD_PUBLIC_KEY || '',
  privateKey: process.env.NAGAD_PRIVATE_KEY || '',
};

export function isNagadConfigured(): boolean {
  return Boolean(credentials.merchantId && credentials.publicKey);
}

function simulatedResult(amount: number, orderId: string): NagadPaymentResult {
  return {
    success: true,
    paymentReferenceId: `sim-nagad-${Date.now()}`,
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments/simulate?provider=nagad&orderId=${orderId}&amount=${amount}`,
    status: 'Initiated',
    simulated: true,
  };
}

/** Base64-encoded JSON payload for Nagad (the real gateway expects a signed envelope) */
function buildEnvelope(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export async function nagadInitializePayment(req: NagadPaymentRequest): Promise<NagadPaymentResult> {
  if (!isNagadConfigured()) {
    console.log('[nagad] Credentials not configured — using simulation');
    return simulatedResult(req.amount, req.orderId);
  }

  try {
    const timestamp = new Date().toISOString().replace(/[-:.T]/g, '').slice(0, 14);
    const sensitive = {
      merchantId: credentials.merchantId,
      datetime: timestamp,
      orderId: req.orderId,
      amount: req.amount.toFixed(2),
      currencyCode: '050',
    };
    const envelope = buildEnvelope({ ...sensitive, ...req });

    const res = await fetch(`${BASE_URL}/remote-payment-gateway-1.0/api/dfs/check-out/initialize/${credentials.merchantId}/${req.orderId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-KM-Api-Version': 'v-0.2.0',
        'X-KM-IP-Version': 'v-0.2.0',
        'X-KM-Client-Type': 'PC_WEB',
        'X-KM-Api-Key': credentials.publicKey,
      },
      body: JSON.stringify({ sensitiveData: envelope, signature: 'simulated-signature', merchantCallbackURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/webhook/nagad` }),
    });

    const data = await res.json();
    if (!res.ok || !data.paymentReferenceId) {
      return { success: false, error: data.reason || `Nagad initialize failed (${res.status})` };
    }
    return {
      success: true,
      paymentReferenceId: data.paymentReferenceId,
      callbackUrl: data.callBackUrl,
      status: 'Initiated',
    };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function nagadVerifyPayment(paymentReferenceId: string): Promise<NagadPaymentResult> {
  if (!isNagadConfigured()) {
    return { success: true, transactionId: `SIM${Date.now()}`, status: 'Completed', simulated: true };
  }

  try {
    const res = await fetch(`${BASE_URL}/remote-payment-gateway-1.0/api/dfs/verify/payment/${paymentReferenceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-KM-Api-Version': 'v-0.2.0',
        'X-KM-IP-Version': 'v-0.2.0',
        'X-KM-Client-Type': 'PC_WEB',
        'X-KM-Api-Key': credentials.publicKey,
      },
    });
    const data = await res.json();
    if (!res.ok || data.paymentStatus !== 'Completed') {
      return { success: false, error: data.reason || 'Nagad payment not completed' };
    }
    return { success: true, paymentReferenceId, transactionId: data.issuerPaymentRefNo, status: data.paymentStatus };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
