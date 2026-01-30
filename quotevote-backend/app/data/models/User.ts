import mongoose, { Schema } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import type { UserDocument, UserModel } from '../../types/mongoose';

const UserSchema = new Schema<UserDocument, UserModel>(
    {
        name: { type: String, trim: true },
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        password: { type: String, required: true },
        avatar: { type: String },
        contributorBadge: { type: Boolean, default: false },
        admin: { type: Boolean, default: false },
        _followingId: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        _followersId: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        upvotes: { type: Number, default: 0 },
        downvotes: { type: Number, default: 0 },
        accountStatus: {
            type: String,
            enum: ['active', 'disabled'],
            default: 'active'
        },
        botReports: { type: Number, default: 0 },
        lastBotReportDate: { type: Date },
        joined: { type: Date, default: Date.now },
        reputation: {
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
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Pre-save hook: explicit 'this' and async
UserSchema.pre('save', async function (this: UserDocument) {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Instance method: comparePassword
UserSchema.methods.comparePassword = async function (this: UserDocument, candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Static method: findByUsername
UserSchema.statics.findByUsername = function (username: string) {
    return this.findOne({ username });
};

// Static method: findByEmail
UserSchema.statics.findByEmail = function (email: string) {
    return this.findOne({ email });
};

// Check if model already exists
const User = (mongoose.models.User as UserModel) || mongoose.model<UserDocument, UserModel>('User', UserSchema);

export default User;
