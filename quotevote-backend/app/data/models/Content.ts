import mongoose, { Schema } from 'mongoose';
import type { ContentDocument, ContentModel } from '~/types/mongoose';

const ContentSchema = new Schema<ContentDocument, ContentModel>(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: 'Creator', required: true },
    domainId: { type: Schema.Types.ObjectId, ref: 'Domain' },
    title: { type: String, required: true },
    url: { type: String },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Content =
  (mongoose.models.Content as ContentModel) ||
  mongoose.model<ContentDocument, ContentModel>('Content', ContentSchema);

export default Content;
