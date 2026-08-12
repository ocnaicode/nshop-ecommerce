import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISellerDocument extends Document {
  userId: Types.ObjectId;
  shopId?: Types.ObjectId;
  businessName: string;
  ownerName: string;
  phone: string;
  email?: string;
  status: string;
  verificationStatus: string;
  verificationDocuments: {
    type: string;
    url: string;
    publicId: string;
    status: string;
    uploadedAt: Date;
  }[];
  isVerified: boolean;
  subscription: {
    plan: string;
    status: string;
    startDate?: Date;
    endDate?: Date;
    trialEndsAt?: Date;
  };
  performance: {
    rating: number;
    totalRatings: number;
    completionRate: number;
    cancellationRate: number;
    lateOrderRate: number;
    returnRate: number;
    responseTime: number;
    score: number;
  };
  codConfig: {
    enabled: boolean;
    fee: number;
    maxOrderAmount: number;
  };
  deliveryConfig: {
    sellerDelivery: {
      enabled: boolean;
      radius: number;
      zones: Array<{
        name: string;
        minDistance: number;
        maxDistance: number;
        fee: number;
        estimatedTime: number;
      }>;
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
  };
  openingHours: {
    open: string;
    close: string;
    days: number[];
  };
}

const sellerSchema = new Schema<ISellerDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop' },
    businessName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true },
    status: {
      type: String,
      enum: ['pending', 'verification_pending', 'approved', 'active', 'at_risk', 'suspended', 'churned'],
      default: 'pending',
    },
    verificationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted',
    },
    verificationDocuments: [{
      type: String,
      url: String,
      publicId: String,
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      uploadedAt: { type: Date, default: Date.now },
    }],
    isVerified: { type: Boolean, default: false },
    subscription: {
      plan: { type: String, default: 'free' },
      status: { type: String, default: 'inactive' },
      startDate: Date,
      endDate: Date,
      trialEndsAt: Date,
    },
    performance: {
      rating: { type: Number, default: 0 },
      totalRatings: { type: Number, default: 0 },
      completionRate: { type: Number, default: 100 },
      cancellationRate: { type: Number, default: 0 },
      lateOrderRate: { type: Number, default: 0 },
      returnRate: { type: Number, default: 0 },
      responseTime: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
    },
    codConfig: {
      enabled: { type: Boolean, default: true },
      fee: { type: Number, default: 10 },
      maxOrderAmount: { type: Number, default: 10000 },
    },
    deliveryConfig: {
      sellerDelivery: {
        enabled: { type: Boolean, default: true },
        radius: { type: Number, default: 10 },
        zones: [{
          name: String,
          minDistance: Number,
          maxDistance: Number,
          fee: Number,
          estimatedTime: Number,
        }],
        freeDeliveryThreshold: Number,
        minimumOrder: { type: Number, default: 0 },
        estimatedPreparationTime: { type: Number, default: 30 },
      },
      platformDelivery: {
        enabled: { type: Boolean, default: false },
      },
      selfPickup: {
        enabled: { type: Boolean, default: true },
      },
    },
    openingHours: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
      days: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
    },
  },
  { timestamps: true }
);

sellerSchema.index({ userId: 1 });
sellerSchema.index({ status: 1 });
sellerSchema.index({ 'subscription.plan': 1, 'subscription.status': 1 });

export const Seller = mongoose.models.Seller || mongoose.model<ISellerDocument>('Seller', sellerSchema);
