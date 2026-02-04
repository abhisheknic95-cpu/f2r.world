import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  vendor: mongoose.Types.ObjectId;
  name: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  vendorDiscount: number;
  websiteDiscount: number;
  finalPrice: number;
  status: 'pending' | 'confirmed' | 'packaging' | 'ready_to_pickup' | 'picked_up' | 'in_transit' | 'delivered' | 'rto' | 'lost' | 'cancelled';
  trackingId?: string;
  deliveredAt?: Date;
  commission: number;
  vendorEarning: number;
}

export interface IOrder extends Document {
  orderId: string;
  customer: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  billingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  subtotal: number;
  shippingCharges: number;
  discount: number;
  couponCode?: string;
  couponDiscount: number;
  total: number;
  paymentMethod: 'cod' | 'razorpay' | 'wallet';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  estimatedDelivery?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  name: { type: String, required: true },
  image: String,
  size: { type: String, required: true },
  color: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  mrp: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  vendorDiscount: { type: Number, default: 0 },
  websiteDiscount: { type: Number, default: 0 },
  finalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'packaging', 'ready_to_pickup', 'picked_up', 'in_transit', 'delivered', 'rto', 'lost', 'cancelled'],
    default: 'pending',
  },
  trackingId: String,
  deliveredAt: Date,
  commission: { type: Number, required: true },
  vendorEarning: { type: Number, required: true },
});

const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    billingAddress: {
      name: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    shippingCharges: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    couponCode: String,
    couponDiscount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'razorpay', 'wallet'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
    },
    estimatedDelivery: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Generate unique order ID
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    this.orderId = `F2R${year}${month}${random}`;
  }
  next();
});

export default mongoose.model<IOrder>('Order', orderSchema);
