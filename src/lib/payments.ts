import { PAYMENT_METHOD } from '@/config/constants';

// =============================================================================
// Payment Gateway Abstraction — bKash, Nagad, SSLCommerz
// =============================================================================
// All gateways are environment-driven. When credentials are missing the
// helpers return `null`/`false` and the app gracefully falls back to a
// "pending" payment flow (admin can mark paid from the Payments screen).

export type SupportedPaymentMethod = 'cod' | 'bkash' | 'nagad' | 'sslcommerz';

export interface GatewayConfig {
  enabled: boolean;
  baseUrl: string;
  [key: string]: string | boolean;
}

const envFlag = (name: string) => process.env[name] === 'true';

export const PAYMENT_GATEWAYS: Record<string, GatewayConfig> = {
  bkash: {
    enabled: envFlag('ENABLE_BKASH'),
    baseUrl: process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    appKey: process.env.BKASH_APP_KEY || '',
    appSecret: process.env.BKASH_APP_SECRET || '',
    username: process.env.BKASH_USERNAME || '',
    password: process.env.BKASH_PASSWORD || '',
  },
  nagad: {
    enabled: envFlag('ENABLE_NAGAD'),
    baseUrl:
      process.env.NAGAD_BASE_URL ||
      'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs',
    merchantId: process.env.NAGAD_MERCHANT_ID || '',
    merchantKey: process.env.NAGAD_MERCHANT_KEY || '',
    pgPublicKey: process.env.NAGAD_PG_PUBLIC_KEY || '',
  },
  sslcommerz: {
    enabled: envFlag('ENABLE_SSLCOMMERZ'),
    baseUrl: process.env.SSLCOMMERZ_BASE_URL || 'https://sandbox.sslcommerz.com',
    storeId: process.env.SSLCOMMERZ_STORE_ID || '',
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
  },
};

export function isGatewayConfigured(method: string): boolean {
  if (method === PAYMENT_METHOD.COD) return true;
  const gw = PAYMENT_GATEWAYS[method];
  if (!gw) return false;
  const requiredKeys = method === 'bkash'
    ? ['appKey', 'appSecret', 'username', 'password']
    : method === 'nagad'
      ? ['merchantId', 'merchantKey', 'pgPublicKey']
      : ['storeId', 'storePassword'];
  return requiredKeys.every((k) => Boolean(gw[k]));
}

export function isPaymentMethodEnabled(method: string): boolean {
  if (method === PAYMENT_METHOD.COD) return true;
  const gw = PAYMENT_GATEWAYS[method];
  return Boolean(gw && gw.enabled && isGatewayConfigured(method));
}

export function getEnabledPaymentMethods(): string[] {
  const methods: string[] = [PAYMENT_METHOD.COD];
  for (const method of [PAYMENT_METHOD.BKASH, PAYMENT_METHOD.NAGAD, PAYMENT_METHOD.SSLCOMMERZ]) {
    if (isPaymentMethodEnabled(method)) methods.push(method);
  }
  return methods;
}

export interface GatewayPaymentRequest {
  method: SupportedPaymentMethod;
  amount: number;
  orderNumber: string;
  customer: { name: string; phone: string; email?: string };
  productName?: string;
  returnUrl: string;
  callbackUrl: string;
}

export interface GatewayPaymentResult {
  gatewayUrl?: string;
  transactionId?: string;
  status: 'redirect' | 'pending' | 'unavailable';
}

// Gateway SDKs return loosely-typed JSON; callers access fields defensively.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

// ---------------------------------------------------------------------------
// bKash — Tokenized Checkout (sandbox v1.2.0-beta)
// ---------------------------------------------------------------------------
async function initiateBkash(req: GatewayPaymentRequest): Promise<GatewayPaymentResult> {
  const gw = PAYMENT_GATEWAYS.bkash;
  const tokenRes = await fetchJson(`${gw.baseUrl}/tokenized/checkout/token/grant`, {
    method: 'POST',
    body: JSON.stringify({
      app_key: gw.appKey,
      app_secret: gw.appSecret,
    }),
  });

  if (!tokenRes.id_token) {
    console.error('[payments] bKash token grant failed:', tokenRes);
    return { status: 'unavailable' };
  }

  const createRes = await fetchJson(`${gw.baseUrl}/tokenized/checkout/create`, {
    method: 'POST',
    headers: { Authorization: tokenRes.id_token, 'X-APP-Key': String(gw.appKey) },
    body: JSON.stringify({
      mode: '0011',
      payerReference: req.customer.phone,
      callbackURL: req.callbackUrl,
      amount: String(req.amount),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: req.orderNumber,
    }),
  });

  if (createRes.bkashURL && createRes.paymentID) {
    return { gatewayUrl: createRes.bkashURL, transactionId: createRes.paymentID, status: 'redirect' };
  }
  console.error('[payments] bKash create failed:', createRes);
  return { status: 'unavailable' };
}

// ---------------------------------------------------------------------------
// Nagad — Initialize Payment
// ---------------------------------------------------------------------------
async function initiateNagad(req: GatewayPaymentRequest): Promise<GatewayPaymentResult> {
  const gw = PAYMENT_GATEWAYS.nagad;
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14);
  const payload = JSON.stringify({
    merchantCallbackURL: req.callbackUrl,
    merchantInvoiceNumber: req.orderNumber,
    amount: String(req.amount),
    currencyCode: '050',
    customerName: req.customer.name,
    customerMobile: req.customer.phone,
    customerEmail: req.customer.email || 'customer@localmart.com',
  });

  // Note: production integration additionally RSA-encrypts `payload` with the
  // gateway's public key and signs it (sensitiveData). The sandbox accepts
  // the plain payload; when NAGAD_PG_PUBLIC_KEY is provided we pass it along
  // so a production-grade implementation can encrypt before signing.
  const initRes = await fetchJson(`${gw.baseUrl}/checkout/initialize/${gw.merchantId}/${timestamp}`, {
    method: 'POST',
    body: JSON.stringify({
      accountNumber: gw.merchantId,
      paymentReferenceId: timestamp,
      sensitiveData: gw.pgPublicKey ? payload : '',
      publicKey: gw.pgPublicKey || '',
      datetime: timestamp,
    }),
  });

  const paymentRef = initRes.paymentReferenceId || initRes.payment_ref_id;
  if (paymentRef && initRes.callBackUrl) {
    return { gatewayUrl: initRes.callBackUrl, transactionId: paymentRef, status: 'redirect' };
  }
  if (paymentRef) {
    return { status: 'pending', transactionId: paymentRef };
  }
  console.error('[payments] Nagad init failed:', initRes);
  return { status: 'unavailable' };
}

// ---------------------------------------------------------------------------
// SSLCommerz — Hosted Gateway v4
// ---------------------------------------------------------------------------
async function initiateSslCommerz(req: GatewayPaymentRequest): Promise<GatewayPaymentResult> {
  const gw = PAYMENT_GATEWAYS.sslcommerz;
  const form = new URLSearchParams({
    store_id: String(gw.storeId),
    store_passwd: String(gw.storePassword),
    total_amount: String(req.amount),
    currency: 'BDT',
    tran_id: req.orderNumber,
    success_url: `${req.returnUrl}?method=sslcommerz&status=success`,
    fail_url: `${req.returnUrl}?method=sslcommerz&status=fail`,
    cancel_url: `${req.returnUrl}?method=sslcommerz&status=cancel`,
    cus_name: req.customer.name,
    cus_phone: req.customer.phone,
    cus_email: req.customer.email || 'customer@localmart.com',
    product_name: req.productName || 'LocalMart Order',
    product_category: 'general',
    product_profile: 'general',
    ship_name: req.customer.name,
    ship_city: 'Dhaka',
    ship_country: 'Bangladesh',
  });

  const res = await fetch(`${gw.baseUrl}/gwprocess/v4/api.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const text = await res.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (data.status === 'SUCCESS' && data.GatewayPageURL) {
    return { gatewayUrl: data.GatewayPageURL, transactionId: data.sessionkey, status: 'redirect' };
  }
  console.error('[payments] SSLCommerz init failed:', data);
  return { status: 'unavailable' };
}

export async function initiateGatewayPayment(
  req: GatewayPaymentRequest
): Promise<GatewayPaymentResult> {
  if (!isPaymentMethodEnabled(req.method)) {
    return { status: 'unavailable' };
  }
  try {
    switch (req.method) {
      case PAYMENT_METHOD.BKASH:
        return await initiateBkash(req);
      case PAYMENT_METHOD.NAGAD:
        return await initiateNagad(req);
      case PAYMENT_METHOD.SSLCOMMERZ:
        return await initiateSslCommerz(req);
      default:
        return { status: 'unavailable' };
    }
  } catch (error) {
    console.error(`[payments] ${req.method} initiation error:`, error);
    return { status: 'unavailable' };
  }
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------
export interface GatewayVerificationResult {
  success: boolean;
  transactionId?: string;
  reference?: string;
}

export async function verifyGatewayPayment(
  method: string,
  params: Record<string, string>
): Promise<GatewayVerificationResult> {
  try {
    if (method === PAYMENT_METHOD.BKASH) {
      const gw = PAYMENT_GATEWAYS.bkash;
      const paymentID = params.paymentID || params.payment_id;
      if (!paymentID) return { success: false };
      const tokenRes = await fetchJson(`${gw.baseUrl}/tokenized/checkout/token/grant`, {
        method: 'POST',
        body: JSON.stringify({ app_key: gw.appKey, app_secret: gw.appSecret }),
      });
      if (!tokenRes.id_token) return { success: false };
      const executeRes = await fetchJson(`${gw.baseUrl}/tokenized/checkout/execute`, {
        method: 'POST',
        headers: { Authorization: tokenRes.id_token, 'X-APP-Key': String(gw.appKey) },
        body: JSON.stringify({ paymentID }),
      });
      const success = executeRes.transactionStatus === 'Completed' || executeRes.statusCode === '0000';
      return { success, transactionId: executeRes.trxID || paymentID, reference: executeRes.transactionStatus };
    }

    if (method === PAYMENT_METHOD.NAGAD) {
      const gw = PAYMENT_GATEWAYS.nagad;
      const ref = params.payment_ref_id || params.paymentReferenceId;
      if (!ref) return { success: false };
      const res = await fetchJson(`${gw.baseUrl}/checkout/complete/${ref}`, { method: 'GET' });
      const success = res.status === 'Success' || res.statusCode === '000';
      return { success, transactionId: res.transactionId || res.issuerPaymentRefNo || ref };
    }

    if (method === PAYMENT_METHOD.SSLCOMMERZ) {
      const gw = PAYMENT_GATEWAYS.sslcommerz;
      const valId = params.val_id || params.valId;
      const tranId = params.tran_id || params.transaction_id;
      if (!valId && !tranId) return { success: false };
      const query = new URLSearchParams({
        val_id: valId || '',
        store_id: String(gw.storeId),
        store_passwd: String(gw.storePassword),
        format: 'json',
      });
      const res = await fetchJson(
        `${gw.baseUrl}/validator/api/validationserverAPI.php?${query.toString()}`,
        { method: 'GET' }
      );
      const success = res.status === 'VALID' || res.status === 'VALIDATED';
      return { success, transactionId: res.bank_tran_id || tranId, reference: res.status };
    }

    return { success: false };
  } catch (error) {
    console.error(`[payments] ${method} verification error:`, error);
    return { success: false };
  }
}
