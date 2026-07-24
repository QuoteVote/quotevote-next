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

function findByUserIdImpl(this: PresenceModel, userId: string) {
  return this.findOne({ userId });
}

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

PresenceSchema.statics.findByUserId = findByUserIdImpl;
PresenceSchema.statics.updateHeartbeat = updateHeartbeatImpl;

/**
 * Re-bind every schema static onto the live model.
 *
 * Under ts-node-dev / hot reload, `mongoose.models.Presence` often already exists
 * from a previous module evaluation. In that case `mongoose.model(...)` is skipped
 * and schema.statics assigned above never replace the stale methods on the cached
 * model. Binding here (for *all* statics, not just one) keeps call sites on the
 * latest implementation when new statics are added later.
 */
function bindPresenceStatics(model: PresenceModel): PresenceModel {
  model.findByUserId = findByUserIdImpl.bind(model);
  model.updateHeartbeat = updateHeartbeatImpl.bind(model);
  return model;
}

const Presence = bindPresenceStatics(
  (mongoose.models.Presence as PresenceModel) ||
    mongoose.model<PresenceDocument, PresenceModel>('Presence', PresenceSchema)
);

export default Presence;
