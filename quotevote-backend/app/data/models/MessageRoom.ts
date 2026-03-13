import mongoose, { Schema } from 'mongoose';
import type { MessageRoomDocument, MessageRoomModel } from '~/types/mongoose';

// Stub schema — will be expanded in issue 7.20
const MessageRoomSchema = new Schema<MessageRoomDocument, MessageRoomModel>(
  {
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    postId: { type: Schema.Types.ObjectId, ref: 'Post' },
    messageType: { type: String, enum: ['USER', 'POST'] },
    title: { type: String },
    avatar: { type: String },
    lastMessageTime: { type: Date },
    lastActivity: { type: Date },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const MessageRoom =
  (mongoose.models.MessageRoom as MessageRoomModel) ||
  mongoose.model<MessageRoomDocument, MessageRoomModel>('MessageRoom', MessageRoomSchema);

export default MessageRoom;
