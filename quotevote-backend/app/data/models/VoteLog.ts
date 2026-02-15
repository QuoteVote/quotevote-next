import mongoose, { Schema } from 'mongoose';
import type { VoteLogDocument, VoteLogModel } from '../../types/mongoose';

const VoteLogSchema = new Schema<VoteLogDocument, VoteLogModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    type: { type: String, required: true, enum: ['up', 'down'] },
    created: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'VoteLogs',
  }
);

VoteLogSchema.index({ postId: 1 });
VoteLogSchema.index({ userId: 1 });

const VoteLog = (mongoose.models.VoteLog as VoteLogModel) ||
  mongoose.model<VoteLogDocument, VoteLogModel>('VoteLog', VoteLogSchema);

export default VoteLog;
