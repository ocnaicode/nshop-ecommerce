export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'LocalMart',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'All local shops in one place',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  version: '1.0.0',
};

export const AUTH_CONFIG = {
  secret: process.env.AUTH_SECRET || 'fallback-secret-change-me',
  tokenExpiry: process.env.AUTH_TOKEN_EXPIRY || '7d',
  refreshTokenExpiry: process.env.AUTH_REFRESH_TOKEN_EXPIRY || '30d',
  cookieName: 'localmart_session',
  refreshTokenCookieName: 'localmart_refresh',
};

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
};

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  FINANCE_MANAGER: 'finance_manager',
  DELIVERY_MANAGER: 'delivery_manager',
  SUPPORT_AGENT: 'support_agent',
  MARKETING_MANAGER: 'marketing_manager',
  CUSTOMER: 'customer',
  SELLER: 'seller',
  SELLER_STAFF: 'seller_staff',
  RIDER: 'rider',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.FINANCE_MANAGER,
  ROLES.DELIVERY_MANAGER,
  ROLES.SUPPORT_AGENT,
  ROLES.MARKETING_MANAGER,
];

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  ON_THE_WAY: 'on_the_way',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_METHOD = {
  COD: 'cod',
  BKASH: 'bkash',
  NAGAD: 'nagad',
  SSLCOMMERZ: 'sslcommerz',
} as const;

export const DELIVERY_METHOD = {
  SELLER_DELIVERY: 'seller_delivery',
  PLATFORM_DELIVERY: 'platform_delivery',
  SELF_PICKUP: 'self_pickup',
} as const;

export const DELIVERY_STATUS = {
  PENDING: 'pending',
  AWAITING_ASSIGNMENT: 'awaiting_assignment',
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  PICKUP: 'pickup',
  PICKED_UP: 'picked_up',
  ON_THE_WAY: 'on_the_way',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  RETURNED: 'returned',
} as const;

export const PRODUCT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ACTIVE: 'active',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  SUSPENDED: 'suspended',
  ARCHIVED: 'archived',
} as const;

export const SELLER_STATUS = {
  PENDING: 'pending',
  VERIFICATION_PENDING: 'verification_pending',
  APPROVED: 'approved',
  ACTIVE: 'active',
  AT_RISK: 'at_risk',
  SUSPENDED: 'suspended',
  CHURNED: 'churned',
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  BUSINESS: 'business',
  PRO: 'pro',
} as const;

export const WALLET_TRANSACTION_TYPE = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  COMMISSION: 'commission',
  DELIVERY_FEE: 'delivery_fee',
  REFUND: 'refund',
  WITHDRAWAL: 'withdrawal',
  ADJUSTMENT: 'adjustment',
  SUBSCRIPTION: 'subscription',
} as const;

export const STOCK_MOVEMENT_TYPE = {
  PURCHASE: 'purchase',
  POS_SALE: 'pos_sale',
  ONLINE_SALE: 'online_sale',
  RETURN: 'return',
  DAMAGE: 'damage',
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'transfer',
  RESERVATION: 'reservation',
  RELEASE: 'release',
} as const;

export const NOTIFICATION_EVENTS = {
  ORDER_CREATED: 'order_created',
  ORDER_ACCEPTED: 'order_accepted',
  ORDER_READY: 'order_ready',
  RIDER_ASSIGNED: 'rider_assigned',
  ORDER_PICKED_UP: 'order_picked_up',
  ORDER_DELIVERED: 'order_delivered',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  REFUND_COMPLETED: 'refund_completed',
  LOW_STOCK: 'low_stock',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  REFERRAL_REWARDED: 'referral_rewarded',
  LOYALTY_REWARDED: 'loyalty_rewarded',
} as const;

export const LOYALTY_CONFIG = {
  // Points earned per taka spent (1 point per ৳100 by default)
  earnRate: Number(process.env.LOYALTY_EARN_RATE || 0.01),
  // Taka value of a single point when redeeming
  redeemRate: Number(process.env.LOYALTY_REDEEM_RATE || 1),
  // Maximum share of the order subtotal that can be paid with points
  maxRedeemPct: Number(process.env.LOYALTY_MAX_REDEEM_PCT || 0.2),
  // Bonus points awarded to a referrer when their referral places an order
  referralBonus: Number(process.env.LOYALTY_REFERRAL_BONUS || 50),
} as const;

export const PUSH_CONFIG = {
  enabled: process.env.NEXT_PUBLIC_ENABLE_PUSH === 'true',
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  subject: process.env.VAPID_SUBJECT || '',
} as const;

export const SEO_CONFIG = {
  title: 'LocalMart - All Local Shops in One Place',
  description:
    'Discover nearby local shops, order products, and support your local community. Bangladesh\'s premier location-based marketplace.',
  keywords: ['marketplace', 'local shops', 'bangladesh', 'ecommerce', 'delivery', 'bkash', 'nagad'],
  openGraphImage: process.env.NEXT_PUBLIC_OG_IMAGE || '/og-default.png',
} as const;

export const BANGLADESH_DIVISIONS = [
  'Dhaka',
  'Chittagong',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
] as const;

export const CURRENCY = {
  code: 'BDT',
  symbol: '৳',
  locale: 'bn-BD',
};
