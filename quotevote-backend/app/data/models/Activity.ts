import mongoose, { Schema } from 'mongoose';
import type { ActivityDocument, ActivityModel } from '../../types/mongoose';

const ActivitySchema = new Schema<ActivityDocument, ActivityModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    activityType: {
      type: String,
      required: true,
      enum: ['POSTED', 'VOTED', 'COMMENTED', 'QUOTED', 'LIKED', 'UPVOTED', 'DOWNVOTED'],
    },
    postId: { type: Schema.Types.ObjectId, ref: 'Post' },
    voteId: { type: Schema.Types.ObjectId, ref: 'Vote' },
    commentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
    quoteId: { type: Schema.Types.ObjectId, ref: 'Quote' },
    content: { type: String },
    created: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ActivitySchema.index({ userId: 1 });
ActivitySchema.index({ userId: 1, created: -1 });

// Static method: findByUserId
ActivitySchema.statics.findByUserId = function (
  userId: string,
  options?: { limit?: number; offset?: number }
) {
  const query = this.find({ userId }).sort({ created: -1 });
  if (options?.offset) query.skip(options.offset);
  if (options?.limit) query.limit(options.limit);
  return query;
};

const Activity = (mongoose.models.Activity as ActivityModel) ||
  mongoose.model<ActivityDocument, ActivityModel>('Activity', ActivitySchema);

export default Activity;
