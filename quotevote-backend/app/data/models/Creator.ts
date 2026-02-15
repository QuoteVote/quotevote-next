import mongoose, { Schema } from 'mongoose';
import type { CreatorDocument, CreatorModel } from '../../types/mongoose';

const CreatorSchema = new Schema<CreatorDocument, CreatorModel>(
  {
    name: { type: String, required: true },
    avatar: { type: String },
    bio: { type: String },
    created: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'creators',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CreatorSchema.index({ name: 'text' });

const Creator = (mongoose.models.Creator as CreatorModel) ||
  mongoose.model<CreatorDocument, CreatorModel>('Creator', CreatorSchema);

export default Creator;
