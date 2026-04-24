import mongoose, { Schema } from 'mongoose';
import type { VoteDocument, VoteModel } from '~/types/mongoose';

const VoteSchema = new Schema<VoteDocument, VoteModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    type: { type: String, enum: ['up', 'down'], required: true },
    startWordIndex: { type: Number },
    endWordIndex: { type: Number },
    tags: [{ type: String }],
    content: { type: String },
    created: { type: Date, default: Date.now },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
VoteSchema.index({ content: 'text' });
VoteSchema.index({ postId: 1 });
VoteSchema.index({ userId: 1 });
VoteSchema.index({ postId: 1, userId: 1 });

// Static methods
VoteSchema.statics.findByPostId = function (postId: string) {
  return this.find({ postId, deleted: { $ne: true } }).sort({ created: -1 });
};

VoteSchema.statics.findByUserId = function (userId: string) {
  return this.find({ userId, deleted: { $ne: true } }).sort({ created: -1 });
};

const Vote =
  (mongoose.models.Vote as VoteModel) ||
  mongoose.model<VoteDocument, VoteModel>('Vote', VoteSchema);

export default Vote;
