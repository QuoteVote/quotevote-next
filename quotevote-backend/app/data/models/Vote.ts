import mongoose, { Schema } from 'mongoose';
import type { VoteDocument, VoteModel } from '~/types/mongoose';

// Stub schema — will be expanded in issue 7.20
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
  },
  { timestamps: true }
);

const Vote =
  (mongoose.models.Vote as VoteModel) ||
  mongoose.model<VoteDocument, VoteModel>('Vote', VoteSchema);

export default Vote;
