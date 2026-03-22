import mongoose, { Schema } from 'mongoose';
import type { RosterDocument, RosterModel } from '~/types/mongoose';

const RosterSchema = new Schema<RosterDocument, RosterModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buddyId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'blocked'],
      default: 'pending',
    },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound indexes
RosterSchema.index({ userId: 1, buddyId: 1 }, { unique: true });
RosterSchema.index({ userId: 1, status: 1 });

// Pre-save hook: update the 'updated' timestamp
RosterSchema.pre('save', function () {
  this.updated = new Date();
});

// Static methods
RosterSchema.statics.findByUserId = function (userId: string) {
  return this.find({ $or: [{ userId }, { buddyId: userId }] }).sort({ updated: -1 });
};

RosterSchema.statics.findPendingRequests = function (userId: string) {
  return this.find({ buddyId: userId, status: 'pending' }).sort({ created: -1 });
};

RosterSchema.statics.findBlockedUsers = function (userId: string) {
  return this.find({ userId, status: 'blocked' });
};

const Roster =
  (mongoose.models.Roster as RosterModel) ||
  mongoose.model<RosterDocument, RosterModel>('Roster', RosterSchema);

export default Roster;
