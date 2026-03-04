import mongoose, { Schema } from 'mongoose';
import type { DomainDocument, DomainModel } from '~/types/mongoose';

const DomainSchema = new Schema<DomainDocument, DomainModel>(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Domain =
  (mongoose.models.Domain as DomainModel) ||
  mongoose.model<DomainDocument, DomainModel>('Domain', DomainSchema);

export default Domain;
