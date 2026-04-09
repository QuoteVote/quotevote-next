import mongoose, { Schema } from 'mongoose';
import type { CollectionDocument, CollectionModel } from '~/types/mongoose';

const CollectionSchema = new Schema<CollectionDocument, CollectionModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    postIds: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Collection =
  (mongoose.models.Collection as CollectionModel) ||
  mongoose.model<CollectionDocument, CollectionModel>('Collection', CollectionSchema);

export default Collection;
