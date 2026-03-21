import mongoose, { Schema } from 'mongoose';
import type { PostDocument, PostModel } from '~/types/mongoose';

const PostSchema = new Schema<PostDocument, PostModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    title: { type: String, required: true },
    text: { type: String, required: true },
    url: { type: String },
    citationUrl: { type: String, default: null },
    bookmarkedBy: [{ type: String }],
    rejectedBy: [{ type: String }],
    approvedBy: [{ type: String }],
    downvotes: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    created: { type: Date, default: Date.now },
    reported: { type: Number, default: 0 },
    reportedBy: [{ type: String }],
    approved: { type: Number },
    votedBy: [{ type: String }],
    dayPoints: { type: Number, default: 0 },
    pointTimestamp: { type: Date, default: Date.now },
    featuredSlot: {
      type: Number,
      min: 1,
      max: 12,
      unique: true,
      sparse: true,
    },
    messageRoomId: { type: String },
    urlId: { type: String },
    deleted: { type: Boolean, default: false },
    enable_voting: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// ---------- Indexes ----------

// Full-text search on title and text
PostSchema.index({ title: 'text', text: 'text' });

// Featured-slot compound indexes (from legacy schema)
PostSchema.index({ featuredSlot: 1 }, { unique: true, sparse: true });
PostSchema.index({ featuredSlot: 1, created: -1 });
PostSchema.index({ featuredSlot: 1, pointTimestamp: -1 });
PostSchema.index({ featuredSlot: 1, userId: 1 });
PostSchema.index({ featuredSlot: 1, groupId: 1 });
PostSchema.index({ featuredSlot: 1, deleted: 1 });
PostSchema.index({ featuredSlot: 1, approved: 1 });
PostSchema.index({ userId: 1, featuredSlot: 1 });
PostSchema.index({ groupId: 1, featuredSlot: 1 });

// ---------- Static methods ----------

PostSchema.statics.findByUserId = function (userId: string) {
  return this.find({ userId });
};

PostSchema.statics.findFeatured = function (limit = 12) {
  return this.find({ featuredSlot: { $exists: true, $ne: null } })
    .sort({ featuredSlot: 1 })
    .limit(limit);
};

// ---------- Model export ----------

const Post =
  (mongoose.models.Post as PostModel) ||
  mongoose.model<PostDocument, PostModel>('Post', PostSchema);

export default Post;
