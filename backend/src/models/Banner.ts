import mongoose, { Document, Schema } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  image: string;
  mobileImage?: string;
  link?: string;
  position: 'hero' | 'middle' | 'bottom';
  order: number;
  isActive: boolean;
  validFrom?: Date;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    mobileImage: String,
    link: String,
    position: {
      type: String,
      enum: ['hero', 'middle', 'bottom'],
      default: 'hero',
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    validFrom: Date,
    validUntil: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBanner>('Banner', bannerSchema);
