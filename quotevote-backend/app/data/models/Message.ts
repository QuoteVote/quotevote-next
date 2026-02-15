import mongoose, { Schema } from 'mongoose';
import type { MessageDocument, MessageModel } from '../../types/mongoose';

const MessageSchema = new Schema<MessageDocument, MessageModel>(
  {
    messageRoomId: { type: Schema.Types.ObjectId, ref: 'MessageRoom', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String },
    title: { type: String },
    text: { type: String },
    type: { type: String },
    mutation_type: { type: String },
    created: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'Messages',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

MessageSchema.index({ messageRoomId: 1 });
MessageSchema.index({ userId: 1 });

// Static method: findByRoomId
MessageSchema.statics.findByRoomId = function (messageRoomId: string) {
  return this.find({ messageRoomId }).sort({ created: 1 });
};

const Message = (mongoose.models.Message as MessageModel) ||
  mongoose.model<MessageDocument, MessageModel>('Message', MessageSchema);

export default Message;
