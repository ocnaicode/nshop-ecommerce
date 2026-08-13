import mongoose, { Schema, Document, Types } from 'mongoose';

// =============================================================================
// Customer Profile
// =============================================================================
export interface ICustomerProfileDocument extends Document {
  userId: Types.ObjectId;
  savedAddresses: any[];
  defaultAddressId?: string;
  currentLocation?: any;
  favoriteShops: Types.ObjectId[];
  favoriteProducts: Types.ObjectId[];
  wishlist: Types.ObjectId[];
  recentlyViewed: Types.ObjectId[];
  loyaltyPoints: number;
  referralCode: string;
  referredBy?: string;
  totalOrders: number;
  totalSpent: number;
  lifetimeValue: number;
  lifecycle: string;
}

const addressSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, auto: true },
  label: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  area: String,
  union: String,
  upazila: String,
  district: String,
  division: String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const customerProfileSchema = new Schema<ICustomerProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    savedAddresses: [addressSchema],
    defaultAddressId: String,
    currentLocation: Schema.Types.Mixed,
    favoriteShops: [{ type: Schema.Types.ObjectId, ref: 'Shop' }],
    favoriteProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    recentlyViewed: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    loyaltyPoints: { type: Number, default: 0 },
    referralCode: { type: String, unique: true },
    referredBy: String,
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lifetimeValue: { type: Number, default: 0 },
    lifecycle: {
      type: String,
      enum: ['visitor', 'registered', 'first_order', 'repeat', 'loyal', 'inactive', 'reactivated'],
      default: 'registered',
    },
  },
  { timestamps: true }
);

// NOTE: `userId` and `referralCode` already get unique indexes from their
// `unique: true` field options. Declaring non-unique siblings here used to
// create duplicate `userId_1_1` / `referralCode_1_1` indexes that conflicted
// with the unique ones and could leave orphaned indexes (e.g. `id_1`) in the
// database. Only the unique index per field is kept.

export const CustomerProfile = mongoose.models.CustomerProfile ||
  mongoose.model<ICustomerProfileDocument>('CustomerProfile', customerProfileSchema);

// =============================================================================
// Seller Staff
// =============================================================================
export interface ISellerStaffDocument extends Document {
  sellerId: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  permissions: string[];
  isActive: boolean;
}

const sellerStaffSchema = new Schema<ISellerStaffDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

sellerStaffSchema.index({ sellerId: 1, userId: 1 });

export const SellerStaff = mongoose.models.SellerStaff ||
  mongoose.model<ISellerStaffDocument>('SellerStaff', sellerStaffSchema);

// =============================================================================
// Cart
// =============================================================================
export interface ICartDocument extends Document {
  customerId: Types.ObjectId;
  items: {
    productId: Types.ObjectId;
    variantId?: string;
    shopId: Types.ObjectId;
    sellerId: Types.ObjectId;
    name: string;
    image: string;
    price: number;
    quantity: number;
    maxQuantity: number;
  }[];
  couponCode?: string;
  couponDiscount?: number;
  subtotal: number;
  total: number;
  expiresAt: Date;
}

const cartSchema = new Schema<ICartDocument>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [{
      productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      variantId: String,
      shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
      sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
      name: { type: String, required: true },
      image: String,
      price: { type: Number, required: true },
      quantity: { type: Number, required: true, min: 1 },
      maxQuantity: { type: Number, required: true },
    }],
    couponCode: String,
    couponDiscount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

export const Cart = mongoose.models.Cart || mongoose.model<ICartDocument>('Cart', cartSchema);

// =============================================================================
// Payment
// =============================================================================
export interface IPaymentDocument extends Document {
  orderId: Types.ObjectId;
  customerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  method: string;
  amount: number;
  status: string;
  transactionId?: string;
  gatewayResponse?: Record<string, unknown>;
  refundAmount?: number;
}

const paymentSchema = new Schema<IPaymentDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    method: { type: String, enum: ['cod', 'bkash', 'nagad'], required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded', 'cancelled'],
      default: 'pending',
    },
    transactionId: String,
    gatewayResponse: Schema.Types.Mixed,
    refundAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ customerId: 1, createdAt: -1 });

export const Payment = mongoose.models.Payment || mongoose.model<IPaymentDocument>('Payment', paymentSchema);

// =============================================================================
// Review
// =============================================================================
export interface IReviewDocument extends Document {
  orderId: Types.ObjectId;
  customerId: Types.ObjectId;
  productId: Types.ObjectId;
  sellerId: Types.ObjectId;
  shopId: Types.ObjectId;
  rating: number;
  text?: string;
  images?: string[];
  deliveryRating?: number;
  behaviorRating?: number;
  isApproved: boolean;
  sellerReply?: string;
}

const reviewSchema = new Schema<IReviewDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: String,
    images: [String],
    deliveryRating: { type: Number, min: 1, max: 5 },
    behaviorRating: { type: Number, min: 1, max: 5 },
    isApproved: { type: Boolean, default: true },
    sellerReply: String,
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, customerId: 1 }, { unique: true });
reviewSchema.index({ sellerId: 1, isApproved: 1 });
reviewSchema.index({ shopId: 1, isApproved: 1 });

export const Review = mongoose.models.Review || mongoose.model<IReviewDocument>('Review', reviewSchema);

// =============================================================================
// Seller Wallet
// =============================================================================
export interface ISellerWalletDocument extends Document {
  sellerId: Types.ObjectId;
  pendingBalance: number;
  availableBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  lastSettlementAt?: Date;
}

const sellerWalletSchema = new Schema<ISellerWalletDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, unique: true },
    pendingBalance: { type: Number, default: 0, min: 0 },
    availableBalance: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0, min: 0 },
    totalWithdrawn: { type: Number, default: 0, min: 0 },
    lastSettlementAt: Date,
  },
  { timestamps: true }
);

export const SellerWallet = mongoose.models.SellerWallet ||
  mongoose.model<ISellerWalletDocument>('SellerWallet', sellerWalletSchema);

// =============================================================================
// Wallet Transaction
// =============================================================================
export interface IWalletTransactionDocument extends Document {
  walletId: Types.ObjectId;
  sellerId: Types.ObjectId;
  type: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  referenceId?: string;
  referenceType?: string;
  description: string;
}

const walletTransactionSchema = new Schema<IWalletTransactionDocument>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'SellerWallet', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    type: {
      type: String,
      enum: ['credit', 'debit', 'commission', 'delivery_fee', 'refund', 'withdrawal', 'adjustment', 'subscription'],
      required: true,
    },
    amount: { type: Number, required: true },
    previousBalance: { type: Number, required: true },
    newBalance: { type: Number, required: true },
    referenceId: String,
    referenceType: String,
    description: { type: String, required: true },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ sellerId: 1, createdAt: -1 });
walletTransactionSchema.index({ walletId: 1, createdAt: -1 });

export const WalletTransaction = mongoose.models.WalletTransaction ||
  mongoose.model<IWalletTransactionDocument>('WalletTransaction', walletTransactionSchema);

// =============================================================================
// Inventory & Transactions
// =============================================================================
export interface IInventoryDocument extends Document {
  productId: Types.ObjectId;
  variantId?: string;
  sellerId: Types.ObjectId;
  currentStock: number;
  reservedStock: number;
  damagedStock: number;
  returnedStock: number;
  availableStock: number;
}

const inventorySchema = new Schema<IInventoryDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: String,
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    currentStock: { type: Number, default: 0 },
    reservedStock: { type: Number, default: 0 },
    damagedStock: { type: Number, default: 0 },
    returnedStock: { type: Number, default: 0 },
    availableStock: { type: Number, default: 0 },
  },
  { timestamps: true }
);

inventorySchema.index({ productId: 1, variantId: 1 }, { unique: true });
inventorySchema.index({ sellerId: 1 });

export const Inventory = mongoose.models.Inventory ||
  mongoose.model<IInventoryDocument>('Inventory', inventorySchema);

export interface IInventoryTransactionDocument extends Document {
  inventoryId: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: string;
  sellerId: Types.ObjectId;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  createdBy: string;
}

const inventoryTransactionSchema = new Schema<IInventoryTransactionDocument>(
  {
    inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: String,
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    type: {
      type: String,
      enum: ['purchase', 'pos_sale', 'online_sale', 'return', 'damage', 'adjustment', 'transfer', 'reservation', 'release'],
      required: true,
    },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    referenceId: String,
    referenceType: String,
    notes: String,
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

inventoryTransactionSchema.index({ sellerId: 1, createdAt: -1 });
inventoryTransactionSchema.index({ productId: 1, createdAt: -1 });

export const InventoryTransaction = mongoose.models.InventoryTransaction ||
  mongoose.model<IInventoryTransactionDocument>('InventoryTransaction', inventoryTransactionSchema);

// =============================================================================
// Supplier & Purchase
// =============================================================================
export interface ISupplierDocument extends Document {
  sellerId: Types.ObjectId;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
}

const supplierSchema = new Schema<ISupplierDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: String,
    email: String,
    totalDue: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Supplier = mongoose.models.Supplier || mongoose.model<ISupplierDocument>('Supplier', supplierSchema);

export interface IPurchaseDocument extends Document {
  sellerId: Types.ObjectId;
  supplierId: Types.ObjectId;
  items: {
    productId: Types.ObjectId;
    variantId?: string;
    name: string;
    quantity: number;
    buyPrice: number;
    total: number;
  }[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  notes?: string;
}

const purchaseSchema = new Schema<IPurchaseDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: [{
      productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      variantId: String,
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      buyPrice: { type: Number, required: true },
      total: { type: Number, required: true },
    }],
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'partial', 'completed'], default: 'pending' },
    notes: String,
  },
  { timestamps: true }
);

purchaseSchema.index({ sellerId: 1, createdAt: -1 });

export const Purchase = mongoose.models.Purchase || mongoose.model<IPurchaseDocument>('Purchase', purchaseSchema);

// =============================================================================
// Coupon
// =============================================================================
export interface ICouponDocument extends Document {
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  validFrom: Date;
  validUntil: Date;
  applicableSellers?: Types.ObjectId[];
  applicableCategories?: Types.ObjectId[];
  isActive: boolean;
  createdBy: string;
}

const couponSchema = new Schema<ICouponDocument>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    type: { type: String, enum: ['percentage', 'fixed', 'free_delivery'], required: true },
    value: { type: Number, required: true },
    minOrder: { type: Number, default: 0 },
    maxDiscount: Number,
    usageLimit: { type: Number, default: 1000 },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    applicableSellers: [{ type: Schema.Types.ObjectId, ref: 'Seller' }],
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    isActive: { type: Boolean, default: true },
    createdBy: String,
  },
  { timestamps: true }
);

couponSchema.index({ code: 1, isActive: 1 });

export const Coupon = mongoose.models.Coupon || mongoose.model<ICouponDocument>('Coupon', couponSchema);

// =============================================================================
// Subscription Plan
// =============================================================================
export interface ISubscriptionPlanDocument extends Document {
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
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlanDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    monthlyPrice: { type: Number, required: true, min: 0 },
    yearlyPrice: { type: Number, required: true, min: 0 },
    features: { type: Schema.Types.Mixed, default: {} },
    productLimit: { type: Number, default: 10 },
    staffLimit: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const SubscriptionPlan = mongoose.models.SubscriptionPlan ||
  mongoose.model<ISubscriptionPlanDocument>('SubscriptionPlan', subscriptionPlanSchema);

// =============================================================================
// Commission Rule
// =============================================================================
export interface ICommissionRuleDocument extends Document {
  name: string;
  type: string;
  targetId?: string;
  rate: number;
  isActive: boolean;
  priority: number;
}

const commissionRuleSchema = new Schema<ICommissionRuleDocument>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['global', 'category', 'seller', 'product', 'plan', 'delivery'], required: true },
    targetId: String,
    rate: { type: Number, required: true, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
  },
  { timestamps: true }
);

commissionRuleSchema.index({ type: 1, isActive: 1, priority: -1 });

export const CommissionRule = mongoose.models.CommissionRule ||
  mongoose.model<ICommissionRuleDocument>('CommissionRule', commissionRuleSchema);

// =============================================================================
// Rider
// =============================================================================
export interface IRiderDocument extends Document {
  userId: Types.ObjectId;
  name: string;
  phone: string;
  photo?: string;
  vehicleType: string;
  vehicleNumber: string;
  serviceArea: {
    type: string;
    coordinates: number[];
    upazila?: string;
    district?: string;
  };
  isOnline: boolean;
  isActive: boolean;
  isAvailable: boolean;
  currentDeliveryId?: Types.ObjectId;
  totalDeliveries: number;
  totalEarnings: number;
  rating: number;
  totalRatings: number;
  performance: {
    onTimeRate: number;
    failedDeliveries: number;
    avgDeliveryTime: number;
  };
}

const riderSchema = new Schema<IRiderDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    photo: String,
    vehicleType: { type: String, required: true },
    vehicleNumber: { type: String, required: true },
    serviceArea: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] },
      upazila: String,
      district: String,
    },
    isOnline: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    currentDeliveryId: { type: Schema.Types.ObjectId, ref: 'Delivery' },
    totalDeliveries: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    performance: {
      onTimeRate: { type: Number, default: 100 },
      failedDeliveries: { type: Number, default: 0 },
      avgDeliveryTime: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

riderSchema.index({ 'serviceArea': '2dsphere' });
riderSchema.index({ isOnline: 1, isAvailable: 1, isActive: 1 });

export const Rider = mongoose.models.Rider || mongoose.model<IRiderDocument>('Rider', riderSchema);

// =============================================================================
// Delivery
// =============================================================================
export interface IDeliveryDocument extends Document {
  orderId: Types.ObjectId;
  riderId?: Types.ObjectId;
  sellerId: Types.ObjectId;
  status: string;
  pickupLocation: any;
  dropoffLocation: any;
  estimatedDistance?: number;
  estimatedTime?: number;
  actualDistance?: number;
  actualTime?: number;
  riderEarnings?: number;
  timeline: {
    status: string;
    timestamp: Date;
    location?: any;
    notes?: string;
  }[];
}

const deliverySchema = new Schema<IDeliveryDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    riderId: { type: Schema.Types.ObjectId, ref: 'Rider' },
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    status: {
      type: String,
      enum: ['pending', 'awaiting_assignment', 'assigned', 'accepted', 'pickup', 'picked_up', 'on_the_way', 'delivered', 'failed', 'returned'],
      default: 'pending',
    },
    pickupLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
      address: String,
    },
    dropoffLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
      address: String,
    },
    estimatedDistance: Number,
    estimatedTime: Number,
    actualDistance: Number,
    actualTime: Number,
    riderEarnings: Number,
    timeline: [{
      status: String,
      timestamp: { type: Date, default: Date.now },
      location: Schema.Types.Mixed,
      notes: String,
    }],
  },
  { timestamps: true }
);

deliverySchema.index({ riderId: 1, status: 1 });
deliverySchema.index({ orderId: 1 });
deliverySchema.index({ status: 1 });

export const Delivery = mongoose.models.Delivery || mongoose.model<IDeliveryDocument>('Delivery', deliverySchema);

// =============================================================================
// Notification
// =============================================================================
export interface INotificationDocument extends Document {
  userId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  channel: string;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: Schema.Types.Mixed,
    isRead: { type: Boolean, default: false },
    channel: { type: String, enum: ['in_app', 'email', 'sms', 'whatsapp'], default: 'in_app' },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.models.Notification ||
  mongoose.model<INotificationDocument>('Notification', notificationSchema);

// =============================================================================
// Conversation & Message
// =============================================================================
export interface IConversationDocument extends Document {
  participants: {
    userId: Types.ObjectId;
    role: string;
    name: string;
    avatar?: string;
  }[];
  orderId?: Types.ObjectId;
  lastMessage?: {
    text: string;
    senderId: Types.ObjectId;
    createdAt: Date;
  };
}

const conversationSchema = new Schema<IConversationDocument>(
  {
    participants: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      role: { type: String, required: true },
      name: String,
      avatar: String,
    }],
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    lastMessage: {
      text: String,
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: Date,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ 'participants.userId': 1 });

export const Conversation = mongoose.models.Conversation ||
  mongoose.model<IConversationDocument>('Conversation', conversationSchema);

export interface IMessageDocument extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderRole: string;
  text?: string;
  image?: string;
  attachments?: { type: string; url: string; name: string }[];
  isRead: boolean;
}

const messageSchema = new Schema<IMessageDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, required: true },
    text: String,
    image: String,
    attachments: [{ type: String, url: String, name: String }],
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = mongoose.models.Message || mongoose.model<IMessageDocument>('Message', messageSchema);

// =============================================================================
// Loyalty Account & Transaction
// =============================================================================
export interface ILoyaltyAccountDocument extends Document {
  customerId: Types.ObjectId;
  points: number;
  totalEarned: number;
  totalRedeemed: number;
  totalExpired: number;
}

const loyaltyAccountSchema = new Schema<ILoyaltyAccountDocument>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    points: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalRedeemed: { type: Number, default: 0 },
    totalExpired: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const LoyaltyAccount = mongoose.models.LoyaltyAccount ||
  mongoose.model<ILoyaltyAccountDocument>('LoyaltyAccount', loyaltyAccountSchema);

export interface ILoyaltyTransactionDocument extends Document {
  accountId: Types.ObjectId;
  customerId: Types.ObjectId;
  type: string;
  points: number;
  description: string;
  referenceId?: string;
  referenceType?: string;
}

const loyaltyTransactionSchema = new Schema<ILoyaltyTransactionDocument>(
  {
    accountId: { type: Schema.Types.ObjectId, ref: 'LoyaltyAccount', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['earned', 'redeemed', 'expired', 'bonus', 'adjusted'], required: true },
    points: { type: Number, required: true },
    description: { type: String, required: true },
    referenceId: String,
    referenceType: String,
  },
  { timestamps: true }
);

loyaltyTransactionSchema.index({ customerId: 1, createdAt: -1 });

export const LoyaltyTransaction = mongoose.models.LoyaltyTransaction ||
  mongoose.model<ILoyaltyTransactionDocument>('LoyaltyTransaction', loyaltyTransactionSchema);

// =============================================================================
// Referral
// =============================================================================
export interface IReferralDocument extends Document {
  referrerId: Types.ObjectId;
  referrerType: string;
  referredId: Types.ObjectId;
  referredType: string;
  status: string;
  rewardAmount?: number;
  rewardType?: string;
}

const referralSchema = new Schema<IReferralDocument>(
  {
    referrerId: { type: Schema.Types.ObjectId, required: true },
    referrerType: { type: String, enum: ['customer', 'seller', 'rider'], required: true },
    referredId: { type: Schema.Types.ObjectId, required: true },
    referredType: { type: String, enum: ['customer', 'seller', 'rider'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'expired', 'cancelled'], default: 'pending' },
    rewardAmount: Number,
    rewardType: String,
  },
  { timestamps: true }
);

referralSchema.index({ referrerId: 1 });
referralSchema.index({ referredId: 1 }, { unique: true });

export const Referral = mongoose.models.Referral || mongoose.model<IReferralDocument>('Referral', referralSchema);

// =============================================================================
// Withdrawal
// =============================================================================
export interface IWithdrawalDocument extends Document {
  sellerId: Types.ObjectId;
  amount: number;
  method: string;
  accountDetails: Record<string, string>;
  status: string;
  transactionRef?: string;
  adminNotes?: string;
  processedBy?: string;
  processedAt?: Date;
}

const withdrawalSchema = new Schema<IWithdrawalDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, required: true },
    accountDetails: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['pending', 'approved', 'processing', 'completed', 'rejected'], default: 'pending' },
    transactionRef: String,
    adminNotes: String,
    processedBy: String,
    processedAt: Date,
  },
  { timestamps: true }
);

export const Withdrawal = mongoose.models.Withdrawal ||
  mongoose.model<IWithdrawalDocument>('Withdrawal', withdrawalSchema);

// =============================================================================
// Dispute
// =============================================================================
export interface IDisputeDocument extends Document {
  orderId: Types.ObjectId;
  customerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  type: string;
  reason: string;
  description: string;
  evidence: string[];
  status: string;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
}

const disputeSchema = new Schema<IDisputeDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    type: { type: String, enum: ['product_quality', 'delivery_issue', 'payment_issue', 'refund', 'other'], required: true },
    reason: { type: String, required: true },
    description: { type: String, required: true },
    evidence: [String],
    status: { type: String, enum: ['open', 'under_review', 'resolved', 'closed'], default: 'open' },
    resolution: String,
    resolvedBy: String,
    resolvedAt: Date,
  },
  { timestamps: true }
);

disputeSchema.index({ orderId: 1 });
disputeSchema.index({ status: 1, createdAt: -1 });

export const Dispute = mongoose.models.Dispute || mongoose.model<IDisputeDocument>('Dispute', disputeSchema);

// =============================================================================
// Audit Log
// =============================================================================
export interface IAuditLogDocument extends Document {
  actorId: Types.ObjectId;
  actorRole: string;
  action: string;
  target: string;
  targetId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string;
  userAgent?: string;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    target: { type: String, required: true },
    targetId: { type: String, required: true },
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ target: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', auditLogSchema);

// =============================================================================
// Banner
// =============================================================================
export interface IBannerDocument extends Document {
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
}

const bannerSchema = new Schema<IBannerDocument>(
  {
    title: { type: String, required: true },
    image: { type: String, required: true },
    link: String,
    position: { type: String, enum: ['homepage', 'category', 'search', 'shop'], default: 'homepage' },
    targetLocation: String,
    targetCategory: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bannerSchema.index({ position: 1, isActive: 1, order: 1 });

export const Banner = mongoose.models.Banner || mongoose.model<IBannerDocument>('Banner', bannerSchema);

// =============================================================================
// Sponsored Listing
// =============================================================================
export interface ISponsoredListingDocument extends Document {
  sellerId: Types.ObjectId;
  type: string;
  targetId?: string;
  budget: number;
  spent: number;
  dailyBudget?: number;
  impressions: number;
  clicks: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

const sponsoredListingSchema = new Schema<ISponsoredListingDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    type: { type: String, enum: ['product', 'shop', 'category', 'search'], required: true },
    targetId: String,
    budget: { type: Number, required: true },
    spent: { type: Number, default: 0 },
    dailyBudget: Number,
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SponsoredListing = mongoose.models.SponsoredListing ||
  mongoose.model<ISponsoredListingDocument>('SponsoredListing', sponsoredListingSchema);

// =============================================================================
// Business Directory
// =============================================================================
export interface IBusinessDirectoryDocument extends Document {
  name: string;
  slug: string;
  category: string;
  phone: string;
  location: any;
  address: string;
  openingHours?: {
    open: string;
    close: string;
    days: number[];
  };
  photos?: string[];
  description?: string;
  isClaimed: boolean;
  claimedBySellerId?: Types.ObjectId;
  rating: number;
  totalRatings: number;
}

const businessDirectorySchema = new Schema<IBusinessDirectoryDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    phone: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
      address: String,
      area: String,
      upazila: String,
      district: String,
    },
    address: { type: String, required: true },
    openingHours: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
      days: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
    },
    photos: [String],
    description: String,
    isClaimed: { type: Boolean, default: false },
    claimedBySellerId: { type: Schema.Types.ObjectId, ref: 'Seller' },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

businessDirectorySchema.index({ location: '2dsphere' });
businessDirectorySchema.index({ category: 1 });

export const BusinessDirectory = mongoose.models.BusinessDirectory ||
  mongoose.model<IBusinessDirectoryDocument>('BusinessDirectory', businessDirectorySchema);

// =============================================================================
// Analytics Event
// =============================================================================
export interface IAnalyticsEventDocument extends Document {
  userId?: Types.ObjectId;
  sessionId: string;
  event: string;
  data: Record<string, unknown>;
  location?: any;
}

const analyticsEventSchema = new Schema<IAnalyticsEventDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    sessionId: { type: String, required: true },
    event: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    location: Schema.Types.Mixed,
  },
  { timestamps: true }
);

analyticsEventSchema.index({ event: 1, createdAt: -1 });
analyticsEventSchema.index({ userId: 1, event: 1 });

export const AnalyticsEvent = mongoose.models.AnalyticsEvent ||
  mongoose.model<IAnalyticsEventDocument>('AnalyticsEvent', analyticsEventSchema);

// =============================================================================
// Feature Flag
// =============================================================================
export interface IFeatureFlagDocument extends Document {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  conditions?: Record<string, unknown>;
}

const featureFlagSchema = new Schema<IFeatureFlagDocument>(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    enabled: { type: Boolean, default: false },
    conditions: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const FeatureFlag = mongoose.models.FeatureFlag ||
  mongoose.model<IFeatureFlagDocument>('FeatureFlag', featureFlagSchema);

// =============================================================================
// System Config
// =============================================================================
export interface ISystemConfigDocument extends Document {
  key: string;
  value: unknown;
  type: string;
  description?: string;
}

const systemConfigSchema = new Schema<ISystemConfigDocument>(
  {
    key: { type: String, required: true, unique: true },
    value: Schema.Types.Mixed,
    type: { type: String, enum: ['string', 'number', 'boolean', 'object', 'array'], default: 'string' },
    description: String,
  },
  { timestamps: true }
);

export const SystemConfig = mongoose.models.SystemConfig ||
  mongoose.model<ISystemConfigDocument>('SystemConfig', systemConfigSchema);

// =============================================================================
// AI Usage
// =============================================================================
export interface IAIUsageDocument extends Document {
  userId: Types.ObjectId;
  feature: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  cost?: number;
}

const aiUsageSchema = new Schema<IAIUsageDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    feature: { type: String, required: true },
    provider: { type: String, required: true },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    cost: Number,
  },
  { timestamps: true }
);

aiUsageSchema.index({ userId: 1, createdAt: -1 });

export const AIUsage = mongoose.models.AIUsage || mongoose.model<IAIUsageDocument>('AIUsage', aiUsageSchema);

// =============================================================================
// POS Session & Sale
// =============================================================================
export interface IPOSSessionDocument extends Document {
  sellerId: Types.ObjectId;
  shopId: Types.ObjectId;
  staffId: Types.ObjectId;
  status: string;
  openedAt: Date;
  closedAt?: Date;
  openingCash: number;
  closingCash?: number;
  totalSales: number;
  totalTransactions: number;
}

const posSessionSchema = new Schema<IPOSSessionDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    openedAt: { type: Date, default: Date.now },
    closedAt: Date,
    openingCash: { type: Number, default: 0 },
    closingCash: Number,
    totalSales: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

posSessionSchema.index({ sellerId: 1, status: 1 });

export const POSSession = mongoose.models.POSSession ||
  mongoose.model<IPOSSessionDocument>('POSSession', posSessionSchema);

export interface IPOSSaleDocument extends Document {
  sessionId: Types.ObjectId;
  sellerId: Types.ObjectId;
  shopId: Types.ObjectId;
  staffId: Types.ObjectId;
  items: {
    productId: Types.ObjectId;
    variantId?: string;
    name: string;
    quantity: number;
    price: number;
    discount: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerId?: Types.ObjectId;
  customerPhone?: string;
}

const posSaleSchema = new Schema<IPOSSaleDocument>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'POSSession', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
      productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      variantId: String,
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    }],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cash', 'bkash', 'nagad', 'card', 'other'], required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User' },
    customerPhone: String,
  },
  { timestamps: true }
);

posSaleSchema.index({ sellerId: 1, createdAt: -1 });
posSaleSchema.index({ sessionId: 1 });

export const POSSale = mongoose.models.POSSale || mongoose.model<IPOSSaleDocument>('POSSale', posSaleSchema);

// =============================================================================
// Promotion
// =============================================================================
export interface IPromotionDocument extends Document {
  name: string;
  type: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  productIds?: Types.ObjectId[];
  shopIds?: Types.ObjectId[];
  discount?: { type: string; value: number };
  isActive: boolean;
}

const promotionSchema = new Schema<IPromotionDocument>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['flash_sale', 'bundle', 'new_arrival', 'clearance', 'festival', 'featured'], required: true },
    description: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    shopIds: [{ type: Schema.Types.ObjectId, ref: 'Shop' }],
    discount: {
      type: { type: String, enum: ['percentage', 'fixed'] },
      value: Number,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

promotionSchema.index({ type: 1, isActive: 1, startDate: 1, endDate: 1 });

export const Promotion = mongoose.models.Promotion || mongoose.model<IPromotionDocument>('Promotion', promotionSchema);
