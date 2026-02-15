import mongoose, { Schema } from 'mongoose';
import type { RosterDocument, RosterModel } from '../../types/mongoose';

const RosterSchema = new Schema<RosterDocument, RosterModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    buddyId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'accepted', 'declined', 'blocked'],
      default: 'pending',
    },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    created: { type: Date, default: Date.now },
    updated: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

RosterSchema.index({ userId: 1 });
RosterSchema.index({ buddyId: 1 });
RosterSchema.index({ userId: 1, buddyId: 1 }, { unique: true });

// Static method: findByUserId
RosterSchema.statics.findByUserId = function (userId: string) {
  return this.find({ $or: [{ userId }, { buddyId: userId }], status: 'accepted' });
};

// Static method: findPendingRequests
RosterSchema.statics.findPendingRequests = function (userId: string) {
  return this.find({ buddyId: userId, status: 'pending' });
};

// Static method: findBlockedUsers
RosterSchema.statics.findBlockedUsers = function (userId: string) {
  return this.find({ userId, status: 'blocked' });
};

const Roster = (mongoose.models.Roster as RosterModel) ||
  mongoose.model<RosterDocument, RosterModel>('Roster', RosterSchema);

export default Roster;
