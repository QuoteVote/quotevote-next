import mongoose, { Schema } from 'mongoose';
import type { UserInviteDocument, UserInviteModel } from '~/types/mongoose';

const UserInviteSchema = new Schema<UserInviteDocument, UserInviteModel>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    code: { type: String },
    status: { type: String, default: 'pending' },
    expiresAt: { type: Date },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserInviteSchema.index({ email: 1 });
UserInviteSchema.index({ code: 1 });
UserInviteSchema.index({ status: 1 });

UserInviteSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

const UserInvite =
  (mongoose.models.UserInvite as UserInviteModel) ||
  mongoose.model<UserInviteDocument, UserInviteModel>('UserInvite', UserInviteSchema);

export default UserInvite;
