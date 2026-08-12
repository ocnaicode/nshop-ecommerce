import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProductDocument extends Document {
  sellerId: Types.ObjectId;
  shopId: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  images: string[];
  category: Types.ObjectId;
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
  location: {
    type: string;
    coordinates: number[];
  };
}

export interface IProductVariant {
  name: string;
  attributes: Record<string, string>;
  sku: string;
  barcode?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  lowStockThreshold: number;
}

const variantSchema = new Schema({
  name: { type: String, required: true },
  attributes: { type: Map, of: String, default: {} },
  sku: { type: String, required: true },
  barcode: String,
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 5 },
});

const locationSchema = new Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true },
});

const productSchema = new Schema<IProductDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    images: [{ type: String }],
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    brand: { type: String, trim: true },
    sku: { type: String, required: true },
    barcode: String,
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    unit: { type: String, default: 'piece' },
    weight: Number,
    tags: [{ type: String }],
    warranty: String,
    returnPolicy: String,
    variants: [variantSchema],
    status: {
      type: String,
      enum: ['draft', 'published', 'active', 'low_stock', 'out_of_stock', 'suspended', 'archived'],
      default: 'draft',
    },
    isFeatured: { type: Boolean, default: false },
    isSponsored: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
    seoTitle: String,
    seoDescription: String,
    searchKeywords: [{ type: String }],
    location: { type: locationSchema, required: true },
  },
  { timestamps: true }
);

productSchema.index({ location: '2dsphere' });
productSchema.index({ slug: 1 });
productSchema.index({ shopId: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1, status: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text', searchKeywords: 'text' });

export const Product = mongoose.models.Product || mongoose.model<IProductDocument>('Product', productSchema);
