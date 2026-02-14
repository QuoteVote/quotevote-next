import mongoose, { Schema } from 'mongoose';
import type { PresenceDocument, PresenceModel } from '../../types/mongoose';

const PresenceSchema = new Schema<PresenceDocument, PresenceModel>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        status: {
            type: String,
            enum: ['online', 'away', 'dnd', 'offline', 'invisible'],
            default: 'offline'
        },
        statusMessage: { type: String },
        lastHeartbeat: { type: Date, default: Date.now },
        lastSeen: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes
PresenceSchema.index({ status: 1 });
PresenceSchema.index({ lastHeartbeat: 1 });

// Static method: findByUserId
PresenceSchema.statics.findByUserId = function (userId: string) {
    return this.findOne({ userId });
};

// Static method: updateHeartbeat
PresenceSchema.statics.updateHeartbeat = async function (userId: string) {
    return this.findOneAndUpdate(
        { userId },
        { 
            lastHeartbeat: new Date(),
            status: 'online'
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

// Check if model already exists
const Presence = (mongoose.models.Presence as PresenceModel) || mongoose.model<PresenceDocument, PresenceModel>('Presence', PresenceSchema);

export default Presence;
