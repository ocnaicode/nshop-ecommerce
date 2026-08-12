// =============================================================================
// LocalMart - Type Definitions
// =============================================================================

export interface IUser {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  password: string;
  role: string;
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  lastLogin?: Date;
  devices?: IDevice[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IDevice {
  id: string;
  userAgent: string;
  ip: string;
  lastUsed: Date;
}

export interface ICustomerProfile {
  _id: string;
  userId: string;
  savedAddresses: IAddress[];
  defaultAddressId?: string;
  currentLocation?: ILocation;
  favoriteShops: string[];
  favoriteProducts: string[];
  wishlist: string[];
  recentlyViewed: string[];
  loyaltyPoints: number;
  referralCode: string;
  referredBy?: string;
  totalOrders: number;
  totalSpent: number;
  lifetimeValue: number;
  lifecycle: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  _id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  area: string;
  union?: string;
  upazila: string;
  district: string;
  division: string;
  location: ILocation;
  isDefault: boolean;
}

export interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  area?: string;
  upazila?: string;
  district?: string;
  division?: string;
}

export interface ISeller {
  _id: string;
  userId: string;
  shopId?: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email?: string;
  status: string;
  verificationStatus: string;
  verificationDocuments: IVerificationDocument[];
  isVerified: boolean;
  subscription: ISellerSubscription;
  performance: ISellerPerformance;
  codConfig: ICODConfig;
  deliveryConfig: IDeliveryConfig;
  openingHours: IOpeningHours;
  nid?: string;
  tradeLicense?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVerificationDocument {
  type: string;
  url: string;
  publicId: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
}

export interface ISellerSubscription {
  plan: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  trialEndsAt?: Date;
  gracePeriodEndsAt?: Date;
}

export interface ISellerPerformance {
  rating: number;
  totalRatings: number;
  completionRate: number;
  cancellationRate: number;
  lateOrderRate: number;
  returnRate: number;
  responseTime: number;
  score: number;
}

export interface ICODConfig {
  enabled: boolean;
  fee: number;
  maxOrderAmount: number;
}

export interface IDeliveryConfig {
  sellerDelivery: {
    enabled: boolean;
    radius: number;
    zones: IDeliveryZone[];
    freeDeliveryThreshold?: number;
    minimumOrder: number;
    estimatedPreparationTime: number;
  };
  platformDelivery: {
    enabled: boolean;
  };
  selfPickup: {
    enabled: boolean;
  };
}

export interface IDeliveryZone {
  name: string;
  minDistance: number;
  maxDistance: number;
  fee: number;
  estimatedTime: number;
}

export interface IOpeningHours {
  open: string;
  close: string;
  days: number[];
}

export interface ISellerStaff {
  _id: string;
  sellerId: string;
  userId: string;
  name: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface IShop {
  _id: string;
  sellerId: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  banner?: string;
  category: string;
  location: ILocation;
  address: string;
  phone: string;
  rating: number;
  totalRatings: number;
  totalOrders: number;
  isOpen: boolean;
  isFeatured: boolean;
  isSponsored: boolean;
  isVerified: boolean;
  openingHours: IOpeningHours;
  socialLinks?: Record<string, string>;
  seoTitle?: string;
  seoDescription?: string;
  followers: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  parentId?: string;
  icon?: string;
  image?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  order: number;
  isActive: boolean;
  productCount: number;
  shopCount: number;
  createdAt: Date;
}

export interface IProduct {
  _id: string;
  sellerId: string;
  shopId: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  category: string;
  brand?: string;
  sku: string;
  barcode?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  unit: string;
  weight?: number;
  tags: string[];
  warranty?: string;
  returnPolicy?: string;
  variants: IProductVariant[];
  status: string;
  isFeatured: boolean;
  isSponsored: boolean;
  rating: number;
  totalRatings: number;
  totalSold: number;
  seoTitle?: string;
  seoDescription?: string;
  searchKeywords: string[];
  location: ILocation;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductVariant {
  _id?: string;
  name: string;
  attributes: Record<string, string>;
  sku: string;
  barcode?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  lowStockThreshold: number;
}

export interface IInventory {
  _id: string;
  productId: string;
  variantId?: string;
  sellerId: string;
  currentStock: number;
  reservedStock: number;
  damagedStock: number;
  returnedStock: number;
  availableStock: number;
  lastUpdated: Date;
}

export interface IInventoryTransaction {
  _id: string;
  inventoryId: string;
  productId: string;
  variantId?: string;
  sellerId: string;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface ISupplier {
  _id: string;
  sellerId: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  createdAt: Date;
}

export interface IPurchase {
  _id: string;
  sellerId: string;
  supplierId: string;
  items: IPurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  notes?: string;
  createdAt: Date;
}

export interface IPurchaseItem {
  productId: string;
  variantId?: string;
  name: string;
  quantity: number;
  buyPrice: number;
  total: number;
}

export interface ICart {
  _id: string;
  customerId: string;
  items: ICartItem[];
  couponCode?: string;
  couponDiscount?: number;
  subtotal: number;
  total: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItem {
  productId: string;
  variantId?: string;
  shopId: string;
  sellerId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  maxQuantity: number;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  customerId: string;
  sellerId: string;
  shopId: string;
  items: IOrderItem[];
  deliveryAddress: IAddress;
  deliveryMethod: string;
  deliveryStatus: string;
  deliveryFee: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentId?: string;
  status: string;
  subtotal: number;
  discount: number;
  codFee: number;
  platformFee: number;
  commission: number;
  total: number;
  couponCode?: string;
  couponDiscount?: number;
  loyaltyPointsUsed?: number;
  loyaltyPointsEarned?: number;
  notes?: string;
  pickupCode?: string;
  estimatedDelivery?: Date;
  timeline: IOrderTimelineEntry[];
  riderId?: string;
  deliveryTracking?: IDeliveryTracking;
  snapshots: IOrderSnapshots;
  cancellationReason?: string;
  cancelledBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  productId: string;
  variantId?: string;
  name: string;
  image: string;
  sku: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  subtotal: number;
}

export interface IOrderTimelineEntry {
  status: string;
  description: string;
  timestamp: Date;
  actorId?: string;
  actorRole?: string;
}

export interface IDeliveryTracking {
  riderLocation?: ILocation;
  estimatedArrival?: Date;
  lastUpdated?: Date;
}

export interface IOrderSnapshots {
  product: Record<string, { name: string; price: number; sku: string }>;
  shop: { name: string; slug: string; phone: string };
  customer: { name: string; phone: string };
  address: IAddress;
  commission: { rate: number; amount: number };
  deliveryFee: { method: string; amount: number };
}

export interface IPayment {
  _id: string;
  orderId: string;
  customerId: string;
  sellerId: string;
  method: string;
  amount: number;
  status: string;
  transactionId?: string;
  gatewayResponse?: Record<string, unknown>;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISellerWallet {
  _id: string;
  sellerId: string;
  pendingBalance: number;
  availableBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  lastSettlementAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWalletTransaction {
  _id: string;
  walletId: string;
  sellerId: string;
  type: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  referenceId?: string;
  referenceType?: string;
  description: string;
  createdAt: Date;
}

export interface IWithdrawal {
  _id: string;
  sellerId: string;
  amount: number;
  method: string;
  accountDetails: Record<string, string>;
  status: string;
  transactionRef?: string;
  adminNotes?: string;
  processedBy?: string;
  processedAt?: Date;
  createdAt: Date;
}

export interface ICoupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_delivery';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  validFrom: Date;
  validUntil: Date;
  applicableSellers?: string[];
  applicableCategories?: string[];
  applicableLocations?: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface IPromotion {
  _id: string;
  name: string;
  type: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  productIds?: string[];
  shopIds?: string[];
  discount?: { type: string; value: number };
  isActive: boolean;
  createdAt: Date;
}

export interface ISponsoredListing {
  _id: string;
  sellerId: string;
  type: 'product' | 'shop' | 'category' | 'search';
  targetId?: string;
  budget: number;
  spent: number;
  dailyBudget?: number;
  impressions: number;
  clicks: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface IBanner {
  _id: string;
  title: string;
  image: string;
  link?: string;
  position: string;
  targetLocation?: string;
  targetCategory?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  order: number;
  createdAt: Date;
}

export interface ISubscriptionPlan {
  _id: string;
  name: string;
  slug: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: Record<string, boolean | number>;
  productLimit: number;
  staffLimit: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
}

export interface ICommissionRule {
  _id: string;
  name: string;
  type: 'global' | 'category' | 'seller' | 'product' | 'plan' | 'delivery';
  targetId?: string;
  rate: number;
  isActive: boolean;
  priority: number;
  createdAt: Date;
}

export interface IReview {
  _id: string;
  orderId: string;
  customerId: string;
  productId: string;
  sellerId: string;
  shopId: string;
  rating: number;
  text?: string;
  images?: string[];
  deliveryRating?: number;
  behaviorRating?: number;
  isApproved: boolean;
  sellerReply?: string;
  createdAt: Date;
}

export interface IRider {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  photo?: string;
  nid?: string;
  vehicleType: string;
  vehicleNumber: string;
  serviceArea: ILocation;
  isOnline: boolean;
  isActive: boolean;
  isAvailable: boolean;
  currentDeliveryId?: string;
  totalDeliveries: number;
  totalEarnings: number;
  rating: number;
  totalRatings: number;
  performance: {
    onTimeRate: number;
    failedDeliveries: number;
    avgDeliveryTime: number;
  };
  createdAt: Date;
}

export interface IDelivery {
  _id: string;
  orderId: string;
  riderId?: string;
  sellerId: string;
  status: string;
  pickupLocation: ILocation;
  dropoffLocation: ILocation;
  estimatedDistance?: number;
  estimatedTime?: number;
  actualDistance?: number;
  actualTime?: number;
  riderEarnings?: number;
  timeline: IDeliveryTimelineEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeliveryTimelineEntry {
  status: string;
  timestamp: Date;
  location?: ILocation;
  notes?: string;
}

export interface INotification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  channel: string;
  createdAt: Date;
}

export interface IConversation {
  _id: string;
  participants: IConversationParticipant[];
  orderId?: string;
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversationParticipant {
  userId: string;
  role: string;
  name: string;
  avatar?: string;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  text?: string;
  image?: string;
  attachments?: { type: string; url: string; name: string }[];
  isRead: boolean;
  createdAt: Date;
}

export interface IReferral {
  _id: string;
  referrerId: string;
  referrerType: 'customer' | 'seller' | 'rider';
  referredId: string;
  referredType: 'customer' | 'seller' | 'rider';
  status: string;
  rewardAmount?: number;
  rewardType?: string;
  createdAt: Date;
}

export interface ILoyaltyAccount {
  _id: string;
  customerId: string;
  points: number;
  totalEarned: number;
  totalRedeemed: number;
  totalExpired: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoyaltyTransaction {
  _id: string;
  accountId: string;
  customerId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'adjusted';
  points: number;
  description: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: Date;
}

export interface IDispute {
  _id: string;
  orderId: string;
  customerId: string;
  sellerId: string;
  type: string;
  reason: string;
  description: string;
  evidence: string[];
  status: string;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  _id: string;
  actorId: string;
  actorRole: string;
  action: string;
  target: string;
  targetId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface IAnalyticsEvent {
  _id: string;
  userId?: string;
  sessionId: string;
  event: string;
  data: Record<string, unknown>;
  location?: ILocation;
  createdAt: Date;
}

export interface IBusinessDirectory {
  _id: string;
  name: string;
  slug: string;
  category: string;
  phone: string;
  location: ILocation;
  address: string;
  openingHours?: IOpeningHours;
  photos?: string[];
  description?: string;
  isClaimed: boolean;
  claimedBySellerId?: string;
  rating: number;
  totalRatings: number;
  createdAt: Date;
}

export interface IFeatureFlag {
  _id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  conditions?: Record<string, unknown>;
  updatedAt: Date;
}

export interface ISystemConfig {
  _id: string;
  key: string;
  value: unknown;
  type: string;
  description?: string;
  updatedAt: Date;
}

export interface IAIUsage {
  _id: string;
  userId: string;
  feature: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  cost?: number;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface SessionUser {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: string;
  avatar?: string;
  sellerId?: string;
}
