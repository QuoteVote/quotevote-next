import mongoose, { Schema } from 'mongoose';
import type { ActivityDocument, ActivityModel } from '~/types/mongoose';

// Stub schema — will be expanded in issue 7.19+
const ActivitySchema = new Schema<ActivityDocument, ActivityModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post' },
    activityType: { type: String, required: true },
    content: { type: String },
    voteId: { type: Schema.Types.ObjectId, ref: 'Vote' },
    commentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
    quoteId: { type: Schema.Types.ObjectId, ref: 'Quote' },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Activity =
  (mongoose.models.Activity as ActivityModel) ||
  mongoose.model<ActivityDocument, ActivityModel>('Activity', ActivitySchema);

export default Activity;
