import mongoose, { Schema } from 'mongoose';
import type { MessageRoomDocument, MessageRoomModel } from '../../types/mongoose';

const MessageRoomSchema = new Schema<MessageRoomDocument, MessageRoomModel>(
  {
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    postId: { type: Schema.Types.ObjectId, ref: 'Post' },
    messageType: { type: String, enum: ['USER', 'POST'] },
    title: { type: String },
    avatar: { type: String },
    lastMessageTime: { type: Date },
    lastActivity: { type: Date },
    unreadMessages: { type: Number, default: 0 },
    created: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'MessageRoom',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

MessageRoomSchema.index({ users: 1 });
MessageRoomSchema.index({ postId: 1 });

// Static method: findByUserId
MessageRoomSchema.statics.findByUserId = function (userId: string) {
  return this.find({ users: userId }).sort({ lastActivity: -1 });
};

// Static method: findByPostId
MessageRoomSchema.statics.findByPostId = function (postId: string) {
  return this.findOne({ postId, messageType: 'POST' });
};

// Static method: findBetweenUsers
MessageRoomSchema.statics.findBetweenUsers = function (userId1: string, userId2: string) {
  return this.findOne({
    messageType: 'USER',
    users: { $all: [userId1, userId2] },
    $expr: { $eq: [{ $size: '$users' }, 2] },
  });
};

const MessageRoom = (mongoose.models.MessageRoom as MessageRoomModel) ||
  mongoose.model<MessageRoomDocument, MessageRoomModel>('MessageRoom', MessageRoomSchema);

export default MessageRoom;
