import mongoose, { Schema } from 'mongoose';
import type { ReactionDocument, ReactionModel } from '../../types/mongoose';

const ReactionSchema = new Schema<ReactionDocument, ReactionModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
    actionId: { type: Schema.Types.ObjectId },
    emoji: { type: String },
    created: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ReactionSchema.index({ messageId: 1 });
ReactionSchema.index({ actionId: 1 });

// Static method: findByActionId
ReactionSchema.statics.findByActionId = function (actionId: string) {
  return this.find({ actionId });
};

// Static method: findByMessageId
ReactionSchema.statics.findByMessageId = function (messageId: string) {
  return this.find({ messageId });
};

const Reaction = (mongoose.models.Reaction as ReactionModel) ||
  mongoose.model<ReactionDocument, ReactionModel>('Reaction', ReactionSchema);

export default Reaction;
