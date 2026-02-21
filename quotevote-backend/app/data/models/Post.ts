import mongoose, { Schema } from 'mongoose';
import type { PostDocument, PostModel } from '~/types/mongoose';

// Stub schema — will be expanded in issue 7.20
const PostSchema = new Schema<PostDocument, PostModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    title: { type: String },
    text: { type: String },
    url: { type: String },
    citationUrl: { type: String },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    approvedBy: [{ type: String }],
    rejectedBy: [{ type: String }],
    reportedBy: [{ type: String }],
    bookmarkedBy: [{ type: String }],
    enable_voting: { type: Boolean, default: true },
    featuredSlot: { type: Number },
    deleted: { type: Boolean, default: false },
    dayPoints: { type: Number, default: 0 },
    pointTimestamp: { type: Date },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Post =
  (mongoose.models.Post as PostModel) ||
  mongoose.model<PostDocument, PostModel>('Post', PostSchema);

export default Post;
