import mongoose, { Schema } from 'mongoose';
import type { TagDocument, TagModel } from '~/types/mongoose';

const TagSchema = new Schema<TagDocument, TagModel>(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    adminIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    allowedUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    privacy: { type: String, enum: ['public', 'private', 'restricted'], default: 'public' },
    title: { type: String, required: true },
    url: { type: String },
    description: { type: String },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'groups' }
);

TagSchema.statics.findByCreatorId = function (creatorId: string) {
  return this.find({ creatorId });
};

const Tag =
  (mongoose.models.Tag as TagModel) ||
  mongoose.model<TagDocument, TagModel>('Tag', TagSchema, 'groups');

export default Tag;
