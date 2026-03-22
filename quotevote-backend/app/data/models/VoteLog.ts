import mongoose, { Schema } from 'mongoose';
import type { VoteLogDocument, VoteLogModel } from '~/types/mongoose';

const VoteLogSchema = new Schema<VoteLogDocument, VoteLogModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    voteId: { type: Schema.Types.ObjectId, ref: 'Vote', required: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    title: { type: String },
    author: { type: String },
    description: { type: String, required: true },
    action: { type: String },
    type: { type: String, enum: ['up', 'down'], required: true },
    tokens: { type: Number, required: true },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes
VoteLogSchema.index({ userId: 1 });
VoteLogSchema.index({ voteId: 1 });
VoteLogSchema.index({ postId: 1 });

const VoteLog =
  (mongoose.models.VoteLog as VoteLogModel) ||
  mongoose.model<VoteLogDocument, VoteLogModel>('VoteLog', VoteLogSchema);

export default VoteLog;
