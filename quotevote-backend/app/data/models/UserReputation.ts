import mongoose, { Schema } from 'mongoose';
import type { ReputationDocument, ReputationModel } from '~/types/mongoose';

const UserReputationSchema = new Schema<ReputationDocument, ReputationModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    overallScore: { type: Number, default: 0 },
    inviteNetworkScore: { type: Number, default: 0 },
    conductScore: { type: Number, default: 0 },
    activityScore: { type: Number, default: 0 },
    metrics: {
      totalInvitesSent: { type: Number, default: 0 },
      totalInvitesAccepted: { type: Number, default: 0 },
      totalInvitesDeclined: { type: Number, default: 0 },
      averageInviteeReputation: { type: Number, default: 0 },
      totalReportsReceived: { type: Number, default: 0 },
      totalReportsResolved: { type: Number, default: 0 },
      totalUpvotes: { type: Number, default: 0 },
      totalDownvotes: { type: Number, default: 0 },
      totalPosts: { type: Number, default: 0 },
      totalComments: { type: Number, default: 0 },
    },
    lastCalculated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserReputationSchema.index({ overallScore: -1 });
UserReputationSchema.index({ lastCalculated: 1 });

UserReputationSchema.statics.findByUserId = function (userId: string) {
  return this.findOne({ userId });
};

UserReputationSchema.statics.calculateScore = async function (userId: string) {
  const { calculateUserReputation } = await import('~/data/resolvers/utils/reputation');
  const reputationData = await calculateUserReputation(userId);

  return this.findOneAndUpdate(
    { userId },
    {
      overallScore: reputationData.overallScore,
      inviteNetworkScore: reputationData.inviteNetworkScore,
      conductScore: reputationData.conductScore,
      activityScore: reputationData.activityScore,
      metrics: reputationData.metrics,
      lastCalculated: reputationData.lastCalculated,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const UserReputation =
  (mongoose.models.UserReputation as ReputationModel) ||
  mongoose.model<ReputationDocument, ReputationModel>('UserReputation', UserReputationSchema);

export default UserReputation;
