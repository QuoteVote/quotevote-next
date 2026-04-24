import mongoose, { Schema } from 'mongoose';
import type { MessageRoomDocument, MessageRoomModel } from '~/types/mongoose';

const MessageRoomSchema = new Schema<MessageRoomDocument, MessageRoomModel>(
  {
    users: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    postId: { type: Schema.Types.ObjectId, ref: 'Post' },
    messageType: { type: String, enum: ['USER', 'POST'], required: true },
    title: { type: String },
    avatar: { type: String },
    isDirect: { type: Boolean, default: false },
    lastActivity: { type: Date, default: Date.now },
    lastMessageTime: { type: Date },
    lastSeenMessages: { type: Map, of: Schema.Types.ObjectId, default: new Map() },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes
MessageRoomSchema.index({ users: 1, lastActivity: -1 });
MessageRoomSchema.index({ postId: 1 });

// Static methods
MessageRoomSchema.statics.findByUserId = function (userId: string) {
  return this.find({ users: userId }).sort({ lastActivity: -1 });
};

MessageRoomSchema.statics.findByPostId = function (postId: string) {
  return this.findOne({ postId });
};

MessageRoomSchema.statics.findBetweenUsers = function (userId1: string, userId2: string) {
  return this.findOne({
    users: { $all: [userId1, userId2] },
    isDirect: true,
  });
};

const MessageRoom =
  (mongoose.models.MessageRoom as MessageRoomModel) ||
  mongoose.model<MessageRoomDocument, MessageRoomModel>('MessageRoom', MessageRoomSchema);

export default MessageRoom;
