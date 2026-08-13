import mongoose, { Schema, Document, Types } from 'mongoose';

const locationSchema = new Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true },
  address: String,
  area: String,
  upazila: String,
  district: String,
  division: String,
});

// Shop Model
export interface IShopDocument extends Document {
  sellerId: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  banner?: string;
  category: Types.ObjectId;
  location: {
    type: string;
    coordinates: number[];
    address?: string;
    area?: string;
    upazila?: string;
    district?: string;
    division?: string;
  };
  address: string;
  phone: string;
  rating: number;
  totalRatings: number;
  totalOrders: number;
  isOpen: boolean;
  isFeatured: boolean;
  isSponsored: boolean;
  isVerified: boolean;
  openingHours: {
    open: string;
    close: string;
    days: number[];
  };
  socialLinks?: Record<string, string>;
  seoTitle?: string;
  seoDescription?: string;
  followers: number;
}

const shopSchema = new Schema<IShopDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    logo: String,
    banner: String,
    category: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    location: { type: locationSchema, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isSponsored: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    openingHours: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
      days: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
    },
    socialLinks: Schema.Types.Mixed,
    seoTitle: String,
    seoDescription: String,
    followers: { type: Number, default: 0 },
  },
  { timestamps: true }
);

shopSchema.index({ location: '2dsphere' });
shopSchema.index({ category: 1, 'location.coordinates': '2dsphere' });
shopSchema.index({ isFeatured: 1, isOpen: 1 });
shopSchema.index({ name: 'text', description: 'text' });

export const Shop = mongoose.models.Shop || mongoose.model<IShopDocument>('Shop', shopSchema);

// Category Model
export interface ICategoryDocument extends Document {
  name: string;
  slug: string;
  parentId?: Types.ObjectId;
  icon?: string;
  image?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  order: number;
  isActive: boolean;
  productCount: number;
  shopCount: number;
}

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    icon: String,
    image: String,
    description: String,
    seoTitle: String,
    seoDescription: String,
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    productCount: { type: Number, default: 0 },
    shopCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// `slug` is already covered by its unique field option.
categorySchema.index({ parentId: 1 });
categorySchema.index({ isActive: 1, order: 1 });

export const Category = mongoose.models.Category || mongoose.model<ICategoryDocument>('Category', categorySchema);
