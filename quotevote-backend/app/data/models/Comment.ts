import mongoose, { Schema } from 'mongoose';
import type { CommentDocument, CommentModel } from '~/types/mongoose';

// Stub schema — will be expanded in issue 7.21
const CommentSchema = new Schema<CommentDocument, CommentModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    content: { type: String, required: true },
    startWordIndex: { type: Number },
    endWordIndex: { type: Number },
    url: { type: String },
    reaction: { type: String },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Comment =
  (mongoose.models.Comment as CommentModel) ||
  mongoose.model<CommentDocument, CommentModel>('Comment', CommentSchema);

export default Comment;
