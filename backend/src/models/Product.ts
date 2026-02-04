import mongoose, { Document, Schema } from 'mongoose';

export interface IProductVariant {
  size: string;
  color: string;
  stock: number;
  sku: string;
}

export interface IProduct extends Document {
  vendor: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  category: 'slipper' | 'sports_shoes' | 'sneaker' | 'sandals' | 'hawaii' | 'formal' | 'casual';
  brand?: string;
  images: string[];
  video?: string;
  mrp: number;
  sellingPrice: number;
  vendorDiscount: number;
  websiteDiscount: number;
  variants: IProductVariant[];
  upperMaterial?: string;
  soleMaterial?: string;
  warranty?: string;
  usp?: string;
  technology?: string;
  gender: 'men' | 'women' | 'kids' | 'unisex';
  tags: string[];
  rating: number;
  totalReviews: number;
  totalSold: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema({
  size: { type: String, required: true },
  color: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  sku: { type: String, required: true },
});

const productSchema = new Schema<IProduct>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    category: {
      type: String,
      enum: ['slipper', 'sports_shoes', 'sneaker', 'sandals', 'hawaii', 'formal', 'casual'],
      required: true,
    },
    brand: String,
    images: {
      type: [String],
      validate: {
        validator: function (v: string[]) {
          return v.length >= 3;
        },
        message: 'At least 3 product images are required',
      },
    },
    video: String,
    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
    },
    vendorDiscount: {
      type: Number,
      default: 0,
    },
    websiteDiscount: {
      type: Number,
      default: 0,
    },
    variants: [productVariantSchema],
    upperMaterial: String,
    soleMaterial: String,
    warranty: String,
    usp: String,
    technology: String,
    gender: {
      type: String,
      enum: ['men', 'women', 'kids', 'unisex'],
      required: true,
    },
    tags: [String],
    rating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalSold: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create slug from name before saving
productSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();
  }
});

// Calculate final selling price with discounts
productSchema.virtual('finalPrice').get(function () {
  const vendorDiscountAmount = (this.sellingPrice * this.vendorDiscount) / 100;
  const websiteDiscountAmount = (this.sellingPrice * this.websiteDiscount) / 100;
  return this.sellingPrice - vendorDiscountAmount - websiteDiscountAmount;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model<IProduct>('Product', productSchema);
