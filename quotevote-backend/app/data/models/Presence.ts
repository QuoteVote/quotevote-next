import mongoose, { Schema } from 'mongoose';
import type { PresenceDocument, PresenceModel } from '../../types/mongoose';
import type { PresenceStatus } from '../../types/common';

const STATUS_ENUM = ['online', 'away', 'dnd', 'offline', 'invisible'] as const;

const PresenceSchema = new Schema<PresenceDocument, PresenceModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    status: {
      type: String,
      enum: STATUS_ENUM,
      default: 'offline',
    },
    statusMessage: { type: String },
    // Survives stale cleanup (which sets status to offline) so refresh can restore
    // the user's chosen status + message.
    preferredStatus: {
      type: String,
      enum: STATUS_ENUM,
    },
    preferredStatusMessage: { type: String },
    lastHeartbeat: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PresenceSchema.index({ status: 1 });
PresenceSchema.index({ lastHeartbeat: 1 });

PresenceSchema.statics.findByUserId = function (userId: string) {
  return this.findOne({ userId });
};

/**
 * Refresh liveness only. Do not overwrite a user-chosen status/message.
 * If stale cleanup marked the user offline, restore their preferred status.
 */
async function updateHeartbeatImpl(
  this: PresenceModel,
  userId: string
): Promise<PresenceDocument> {
  const now = new Date();
  const existing = await this.findOne({ userId });

  if (!existing) {
    return this.findOneAndUpdate(
      { userId },
      {
        $set: { lastHeartbeat: now, lastSeen: now },
        $setOnInsert: {
          status: 'online',
          preferredStatus: 'online',
          preferredStatusMessage: '',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  existing.lastHeartbeat = now;
  existing.lastSeen = now;

  if (existing.status === 'offline') {
    const preferred = existing.preferredStatus;
    const restore =
      preferred && preferred !== 'offline' ? (preferred as PresenceStatus) : 'online';
    existing.status = restore;
    if (typeof existing.preferredStatusMessage === 'string') {
      existing.statusMessage = existing.preferredStatusMessage;
    }
  }

  return existing.save();
}

PresenceSchema.statics.updateHeartbeat = updateHeartbeatImpl;

// Always bind the latest statics — mongoose.models.Presence may already exist after hot reload.
const Presence =
  (mongoose.models.Presence as PresenceModel) ||
  mongoose.model<PresenceDocument, PresenceModel>('Presence', PresenceSchema);

Presence.updateHeartbeat = updateHeartbeatImpl.bind(Presence);

export default Presence;
