import mongoose, { Schema } from 'mongoose';
import type { ReactionDocument, ReactionModel } from '~/types/mongoose';

const ReactionSchema = new Schema<ReactionDocument, ReactionModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
    actionId: { type: Schema.Types.ObjectId },
    emoji: { type: String, required: true },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes
ReactionSchema.index({ messageId: 1 });
ReactionSchema.index({ actionId: 1 });
ReactionSchema.index({ userId: 1, messageId: 1 });

// Static methods
ReactionSchema.statics.findByActionId = function (actionId: string) {
  return this.find({ actionId }).sort({ created: -1 });
};

ReactionSchema.statics.findByMessageId = function (messageId: string) {
  return this.find({ messageId }).sort({ created: -1 });
};

const Reaction =
  (mongoose.models.Reaction as ReactionModel) ||
  mongoose.model<ReactionDocument, ReactionModel>('Reaction', ReactionSchema);

export default Reaction;
