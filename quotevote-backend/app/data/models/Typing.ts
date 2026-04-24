import mongoose, { Schema } from 'mongoose';
import type { TypingDocument, TypingModel } from '~/types/mongoose';

const TypingSchema = new Schema<TypingDocument, TypingModel>(
  {
    messageRoomId: { type: Schema.Types.ObjectId, ref: 'MessageRoom', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isTyping: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now },
    expiresAt: { type: Date, index: true },
  },
  { timestamps: true }
);

// Compound unique index: one typing indicator per user per room
TypingSchema.index({ messageRoomId: 1, userId: 1 }, { unique: true });

// TTL index: auto-delete expired typing indicators
TypingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save hook: set expiresAt to 10 seconds from now
TypingSchema.pre('save', function () {
  this.expiresAt = new Date(Date.now() + 10 * 1000);
});

// Static methods
TypingSchema.statics.findByRoomId = function (messageRoomId: string) {
  return this.find({ messageRoomId, isTyping: true });
};

const Typing =
  (mongoose.models.Typing as TypingModel) ||
  mongoose.model<TypingDocument, TypingModel>('Typing', TypingSchema);

export default Typing;
