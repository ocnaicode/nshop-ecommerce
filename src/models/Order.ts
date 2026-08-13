import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrderDocument extends Document {
  orderNumber: string;
  customerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  shopId: Types.ObjectId;
  items: {
    productId: Types.ObjectId;
    variantId?: string;
    name: string;
    image: string;
    sku: string;
    price: number;
    discountPrice?: number;
    quantity: number;
    subtotal: number;
  }[];
  deliveryAddress: {
    label: string;
    name: string;
    phone: string;
    address: string;
    area: string;
    upazila: string;
    district: string;
    division: string;
    location: {
      type: string;
      coordinates: number[];
    };
  };
  deliveryMethod: string;
  deliveryStatus: string;
  deliveryFee: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentId?: Types.ObjectId;
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
  timeline: {
    status: string;
    description: string;
    timestamp: Date;
    actorId?: Types.ObjectId;
    actorRole?: string;
  }[];
  riderId?: Types.ObjectId;
  snapshots: {
    product: Map<string, { name: string; price: number; sku: string }>;
    shop: { name: string; slug: string; phone: string };
    customer: { name: string; phone: string };
    commission: { rate: number; amount: number };
    deliveryFee: { method: string; amount: number };
  };
  cancellationReason?: string;
  cancelledBy?: string;
}

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    items: [{
      productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      variantId: String,
      name: { type: String, required: true },
      image: String,
      sku: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      discountPrice: { type: Number, min: 0 },
      quantity: { type: Number, required: true, min: 1 },
      subtotal: { type: Number, required: true, min: 0 },
    }],
    deliveryAddress: {
      label: String,
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      area: String,
      upazila: String,
      district: String,
      division: String,
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
      },
    },
    deliveryMethod: {
      type: String,
      enum: ['seller_delivery', 'platform_delivery', 'self_pickup'],
      required: true,
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'seller_delivery', 'platform_delivery', 'pickup', 'assigned', 'picked_up', 'delivered', 'failed'],
      default: 'pending',
    },
    deliveryFee: { type: Number, default: 0, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['cod', 'bkash', 'nagad'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded', 'cancelled'],
      default: 'pending',
    },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    status: {
      type: String,
      enum: [
        'pending', 'confirmed', 'accepted', 'preparing', 'ready', 'assigned',
        'picked_up', 'on_the_way', 'delivered', 'cancelled', 'returned', 'refunded', 'disputed',
      ],
      default: 'pending',
    },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    codFee: { type: Number, default: 0, min: 0 },
    platformFee: { type: Number, default: 0, min: 0 },
    commission: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    couponCode: String,
    couponDiscount: { type: Number, default: 0 },
    loyaltyPointsUsed: { type: Number, default: 0 },
    loyaltyPointsEarned: { type: Number, default: 0 },
    notes: String,
    pickupCode: String,
    estimatedDelivery: Date,
    timeline: [{
      status: String,
      description: String,
      timestamp: { type: Date, default: Date.now },
      actorId: { type: Schema.Types.ObjectId, ref: 'User' },
      actorRole: String,
    }],
    riderId: { type: Schema.Types.ObjectId, ref: 'Rider' },
    snapshots: {
      product: { type: Map, of: new Schema({ name: String, price: Number, sku: String }, { _id: false }) },
      shop: { name: String, slug: String, phone: String },
      customer: { name: String, phone: String },
      commission: { rate: Number, amount: Number },
      deliveryFee: { method: String, amount: Number },
    },
    cancellationReason: String,
    cancelledBy: String,
  },
  { timestamps: true }
);

// `orderNumber` is already covered by its unique field option.
orderSchema.index({ customerId: 1, status: 1 });
orderSchema.index({ sellerId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.models.Order || mongoose.model<IOrderDocument>('Order', orderSchema);
