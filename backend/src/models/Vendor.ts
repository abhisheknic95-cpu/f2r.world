import mongoose, { Document, Schema } from 'mongoose';

export interface IVendor extends Document {
  user: mongoose.Types.ObjectId;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  gstin?: string;
  panNumber: string;
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  commission: number; // Commission percentage
  isApproved: boolean;
  isActive: boolean;
  documents: {
    panCard?: string;
    gstCertificate?: string;
    cancelledCheque?: string;
  };
  rating: number;
  totalOrders: number;
  totalRevenue: number;
  pendingPayment: number;
  unicommerceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    businessEmail: {
      type: String,
      required: [true, 'Business email is required'],
      lowercase: true,
    },
    businessPhone: {
      type: String,
      required: [true, 'Business phone is required'],
    },
    gstin: {
      type: String,
      trim: true,
    },
    panNumber: {
      type: String,
      required: [true, 'PAN number is required'],
      trim: true,
    },
    bankDetails: {
      accountHolderName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      bankName: { type: String, required: true },
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    commission: {
      type: Number,
      default: 10, // Default 10% commission
      min: 0,
      max: 100,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    documents: {
      panCard: String,
      gstCertificate: String,
      cancelledCheque: String,
    },
    rating: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    pendingPayment: {
      type: Number,
      default: 0,
    },
    unicommerceId: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IVendor>('Vendor', vendorSchema);
