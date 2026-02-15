import mongoose, { Schema } from 'mongoose';
import type { CommentDocument, CommentModel } from '../../types/mongoose';

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
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CommentSchema.index({ postId: 1 });
CommentSchema.index({ userId: 1 });

// Static method: findByPostId
CommentSchema.statics.findByPostId = function (postId: string) {
  return this.find({ postId });
};

// Static method: findByUserId
CommentSchema.statics.findByUserId = function (userId: string) {
  return this.find({ userId });
};

const Comment = (mongoose.models.Comment as CommentModel) ||
  mongoose.model<CommentDocument, CommentModel>('Comment', CommentSchema);

export default Comment;
