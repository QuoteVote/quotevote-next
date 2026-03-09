import mongoose, { Schema } from 'mongoose';
import type { UserInviteDocument, UserInviteModel } from '../../types/mongoose';

const UserInviteSchema = new Schema<UserInviteDocument, UserInviteModel>(
    {
        email: { type: String, required: true, trim: true, lowercase: true, unique: true },
        invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        code: { type: String },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined'],
            default: 'pending',
        },
        created: { type: Date, default: Date.now },
        expiresAt: { type: Date },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Static method: findByEmail
UserInviteSchema.statics.findByEmail = function (email: string) {
    return this.findOne({ email });
};

const UserInvite = (mongoose.models.UserInvite as UserInviteModel) ||
    mongoose.model<UserInviteDocument, UserInviteModel>('UserInvite', UserInviteSchema);

export default UserInvite;
