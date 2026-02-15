import mongoose, { Schema } from 'mongoose';
import type { UserInviteDocument, UserInviteModel } from '../../types/mongoose';

const UserInviteSchema = new Schema<UserInviteDocument, UserInviteModel>(
  {
    email: { type: String, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    code: { type: String },
    status: { type: String, default: 'pending' },
    created: { type: Date, default: Date.now },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserInviteSchema.index({ email: 1 });

// Static method: findByEmail
UserInviteSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email });
};

const UserInvite = (mongoose.models.UserInvite as UserInviteModel) ||
  mongoose.model<UserInviteDocument, UserInviteModel>('UserInvite', UserInviteSchema);

export default UserInvite;
