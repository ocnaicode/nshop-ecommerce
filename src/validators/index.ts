import { z } from 'zod';

// =============================================================================
// Auth Validations
// =============================================================================
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().regex(/^(\+880|880|0)1[3-9]\d{8}$/, 'Invalid Bangladesh phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  role: z.enum(['customer', 'seller']).default('customer'),
  referralCode: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const verifyOtpSchema = z.object({
  phone: z.string(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// =============================================================================
// Product Validations
// =============================================================================
export const productSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  categoryId: z.string().min(1, 'Category is required'),
  brand: z.string().max(100).optional(),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  discountPrice: z.number().min(0).optional().nullable(),
  stock: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  unit: z.string().default('piece'),
  weight: z.number().min(0).optional(),
  tags: z.array(z.string()).default([]),
  warranty: z.string().optional(),
  returnPolicy: z.string().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  variants: z.array(z.object({
    name: z.string(),
    attributes: z.record(z.string(), z.string()),
    sku: z.string(),
    barcode: z.string().optional(),
    price: z.number().min(0),
    discountPrice: z.number().min(0).optional(),
    stock: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0).default(5),
  })).default([]),
  status: z.enum(['draft', 'published', 'active']).default('draft'),
});

// =============================================================================
// Shop Validations
// =============================================================================
export const shopSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  categoryId: z.string().min(1),
  address: z.string().min(5),
  phone: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  area: z.string().optional(),
  upazila: z.string().optional(),
  district: z.string().optional(),
  division: z.string().optional(),
  logo: z.string().optional(),
  banner: z.string().optional(),
  openingHours: z.object({
    open: z.string().default('09:00'),
    close: z.string().default('22:00'),
    days: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  }).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});

// =============================================================================
// Order Validations
// =============================================================================
export const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().int().min(1),
  })).min(1),
  addressId: z.string().min(1, 'Delivery address is required'),
  deliveryMethod: z.enum(['seller_delivery', 'platform_delivery', 'self_pickup']),
  paymentMethod: z.enum(['cod', 'bkash', 'nagad', 'sslcommerz']),
  couponCode: z.string().optional(),
  loyaltyPoints: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    'confirmed', 'accepted', 'preparing', 'ready', 'assigned',
    'picked_up', 'on_the_way', 'delivered', 'cancelled',
  ]),
  reason: z.string().optional(),
});

// =============================================================================
// Review Validations
// =============================================================================
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional(),
  deliveryRating: z.number().int().min(1).max(5).optional(),
  behaviorRating: z.number().int().min(1).max(5).optional(),
  images: z.array(z.string()).max(5).optional(),
});

// =============================================================================
// Seller Validations
// =============================================================================
export const sellerRegistrationSchema = z.object({
  businessName: z.string().min(2).max(200),
  ownerName: z.string().min(2).max(100),
  phone: z.string(),
  email: z.string().email().optional().or(z.literal('')),
});

export const sellerDeliveryConfigSchema = z.object({
  sellerDelivery: z.object({
    enabled: z.boolean(),
    radius: z.number().min(0).max(100),
    zones: z.array(z.object({
      name: z.string(),
      minDistance: z.number().min(0),
      maxDistance: z.number().min(0),
      fee: z.number().min(0),
      estimatedTime: z.number().min(0),
    })),
    freeDeliveryThreshold: z.number().min(0).optional(),
    minimumOrder: z.number().min(0).default(0),
    estimatedPreparationTime: z.number().min(0).default(30),
  }),
  platformDelivery: z.object({
    enabled: z.boolean(),
  }),
  selfPickup: z.object({
    enabled: z.boolean(),
  }),
});

// =============================================================================
// Coupon Validations
// =============================================================================
export const couponSchema = z.object({
  code: z.string().min(3).max(30),
  type: z.enum(['percentage', 'fixed', 'free_delivery']),
  value: z.number().min(0),
  minOrder: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).default(1000),
  perUserLimit: z.number().int().min(1).default(1),
  validFrom: z.string(),
  validUntil: z.string(),
  applicableSellers: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
});

// =============================================================================
// Category Validations
// =============================================================================
export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  parentId: z.string().optional().nullable(),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  order: z.number().int().default(0),
});

// =============================================================================
// Cart Validations
// =============================================================================
export const addToCartSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).max(99),
});

// =============================================================================
// Address Validations
// =============================================================================
export const addressSchema = z.object({
  label: z.string().min(1).max(50),
  name: z.string().min(2).max(100),
  phone: z.string(),
  address: z.string().min(5),
  area: z.string().optional(),
  union: z.string().optional(),
  upazila: z.string().optional(),
  district: z.string().optional(),
  division: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isDefault: z.boolean().default(false),
});

// =============================================================================
// POS Validations
// =============================================================================
export const posSaleSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    name: z.string(),
    quantity: z.number().int().min(1),
    price: z.number().min(0),
    discount: z.number().min(0).default(0),
  })).min(1),
  paymentMethod: z.enum(['cash', 'bkash', 'nagad', 'card', 'other']),
  customerId: z.string().optional(),
  customerPhone: z.string().optional(),
  discount: z.number().min(0).default(0),
});

// =============================================================================
// Withdrawal Validations
// =============================================================================
export const withdrawalSchema = z.object({
  amount: z.number().min(100, 'Minimum withdrawal is ৳100'),
  method: z.enum(['bkash', 'nagad', 'bank_transfer']),
  accountNumber: z.string().min(1),
  accountName: z.string().min(1),
});

// =============================================================================
// Banner Validations
// =============================================================================
export const bannerSchema = z.object({
  title: z.string().min(2).max(200),
  image: z.string().min(1),
  link: z.string().url().optional(),
  position: z.enum(['homepage', 'category', 'search', 'shop']).default('homepage'),
  targetLocation: z.string().optional(),
  targetCategory: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  order: z.number().int().default(0),
});

// =============================================================================
// Subscription Plan Validations
// =============================================================================
export const subscriptionPlanSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  monthlyPrice: z.number().min(0),
  yearlyPrice: z.number().min(0),
  productLimit: z.number().int().min(-1), // -1 for unlimited
  staffLimit: z.number().int().min(-1),
  features: z.record(z.string(), z.union([z.boolean(), z.number()])).default({}),
  order: z.number().int().default(0),
});
