import mongoose, { Schema } from 'mongoose';
import type { PostDocument, PostModel } from '../../types/mongoose';

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
    votedBy: [{ userId: { type: String }, type: { type: String } }],
    enable_voting: { type: Boolean, default: true },
    featuredSlot: { type: Number, min: 1, max: 12, sparse: true, unique: true },
    deleted: { type: Boolean, default: false },
    reported: { type: Number, default: 0 },
    dayPoints: { type: Number, default: 0 },
    pointTimestamp: { type: Date, default: Date.now },
    messageRoomId: { type: String },
    urlId: { type: String },
    created: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Text search index on title and text
PostSchema.index({ title: 'text', text: 'text' });
PostSchema.index({ featuredSlot: 1 }, { sparse: true });
PostSchema.index({ userId: 1 });
PostSchema.index({ dayPoints: -1, pointTimestamp: -1 });

// Static method: findByUserId
PostSchema.statics.findByUserId = function (userId: string) {
  return this.find({ userId });
};

// Static method: findFeatured
PostSchema.statics.findFeatured = function (limit?: number) {
  const query = this.find({ featuredSlot: { $exists: true, $ne: null } })
    .sort({ featuredSlot: 1 });
  return limit ? query.limit(limit) : query;
};

const Post = (mongoose.models.Post as PostModel) ||
  mongoose.model<PostDocument, PostModel>('Post', PostSchema);

export default Post;
