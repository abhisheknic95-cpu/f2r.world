import mongoose, { Document, Schema } from 'mongoose';

export interface IVendorPayment extends Document {
  vendor: mongoose.Types.ObjectId;
  orders: mongoose.Types.ObjectId[];
  period: {
    from: Date;
    to: Date;
  };
  grossAmount: number;
  commission: number;
  deductions: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  transactionId?: string;
  paidAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vendorPaymentSchema = new Schema<IVendorPayment>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    orders: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    period: {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
    },
    grossAmount: {
      type: Number,
      required: true,
    },
    commission: {
      type: Number,
      required: true,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed'],
      default: 'pending',
    },
    transactionId: String,
    paidAt: Date,
    remarks: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IVendorPayment>('VendorPayment', vendorPaymentSchema);
