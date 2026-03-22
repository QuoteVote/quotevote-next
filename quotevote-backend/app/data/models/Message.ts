import mongoose, { Schema } from 'mongoose';
import type { MessageDocument, MessageModel } from '~/types/mongoose';

const ReadByDetailedSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date },
  },
  { _id: false }
);

const DeliveredToSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    deliveredAt: { type: Date },
  },
  { _id: false }
);

const MessageSchema = new Schema<MessageDocument, MessageModel>(
  {
    messageRoomId: { type: Schema.Types.ObjectId, ref: 'MessageRoom', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String },
    title: { type: String },
    text: { type: String, required: true },
    type: { type: String },
    mutation_type: { type: String },
    deleted: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    readByDetailed: { type: [ReadByDetailedSchema], default: [] },
    deliveredTo: { type: [DeliveredToSchema], default: [] },
    created: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

// Indexes
MessageSchema.index({ messageRoomId: 1, created: -1 });
MessageSchema.index({ userId: 1 });

// Static methods
MessageSchema.statics.findByRoomId = function (messageRoomId: string) {
  return this.find({ messageRoomId, deleted: { $ne: true } }).sort({ created: 1 });
};

const Message =
  (mongoose.models.Message as MessageModel) ||
  mongoose.model<MessageDocument, MessageModel>('Message', MessageSchema);

export default Message;
