import mongoose, { Schema } from 'mongoose';
import type { VoteDocument, VoteModel } from '../../types/mongoose';

const VoteSchema = new Schema<VoteDocument, VoteModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    type: { type: String, required: true, enum: ['up', 'down'] },
    startWordIndex: { type: Number },
    endWordIndex: { type: Number },
    tags: [{ type: String }],
    content: { type: String },
    created: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

VoteSchema.index({ postId: 1 });
VoteSchema.index({ userId: 1 });

// Static method: findByPostId
VoteSchema.statics.findByPostId = function (postId: string) {
  return this.find({ postId });
};

// Static method: findByUserId
VoteSchema.statics.findByUserId = function (userId: string) {
  return this.find({ userId });
};

const Vote = (mongoose.models.Vote as VoteModel) ||
  mongoose.model<VoteDocument, VoteModel>('Vote', VoteSchema);

export default Vote;
