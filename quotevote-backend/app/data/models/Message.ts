import mongoose, { Schema } from 'mongoose';
import type { MessageDocument, MessageModel } from '~/types/mongoose';

// Stub schema — will be expanded in issue 7.20
const MessageSchema = new Schema<MessageDocument, MessageModel>(
  {
    messageRoomId: { type: Schema.Types.ObjectId, ref: 'MessageRoom', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String },
    title: { type: String },
    text: { type: String },
    type: { type: String },
    mutation_type: { type: String },
    deleted: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Message =
  (mongoose.models.Message as MessageModel) ||
  mongoose.model<MessageDocument, MessageModel>('Message', MessageSchema);

export default Message;
