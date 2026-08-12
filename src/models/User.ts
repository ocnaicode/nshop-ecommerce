import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
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
  refreshToken?: string;
  otpCode?: string;
  otpExpires?: Date;
  resetToken?: string;
  resetTokenExpires?: Date;
}

const deviceSchema = new Schema({
  id: String,
  userAgent: String,
  ip: String,
  lastUsed: Date,
});

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, sparse: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: [
        'super_admin', 'admin', 'finance_manager', 'delivery_manager',
        'support_agent', 'marketing_manager', 'customer', 'seller',
        'seller_staff', 'rider',
      ],
      default: 'customer',
    },
    avatar: String,
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: String,
    lastLogin: Date,
    refreshToken: String,
    otpCode: String,
    otpExpires: Date,
    resetToken: String,
    resetTokenExpires: Date,
  },
  { timestamps: true }
);

userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

export const User = mongoose.models.User || mongoose.model<IUserDocument>('User', userSchema);
