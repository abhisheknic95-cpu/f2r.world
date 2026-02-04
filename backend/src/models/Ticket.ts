import mongoose, { Document, Schema } from 'mongoose';

export interface ITicket extends Document {
  ticketId: string;
  vendor: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  type: 'missing_pair' | 'damage_pair' | 'wrong_products' | 'other';
  description: string;
  images?: string[];
  video?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'rejected';
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    ticketId: {
      type: String,
      unique: true,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    type: {
      type: String,
      enum: ['missing_pair', 'damage_pair', 'wrong_products', 'other'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: [String],
    video: String,
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'rejected'],
      default: 'open',
    },
    resolution: String,
  },
  {
    timestamps: true,
  }
);

// Generate unique ticket ID
ticketSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketId = `TKT${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model<ITicket>('Ticket', ticketSchema);
