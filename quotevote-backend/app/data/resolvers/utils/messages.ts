import { Types } from 'mongoose';
import Message from '~/data/models/Message';
import MessageRoom from '~/data/models/MessageRoom';
import type { MessageDocument, MessageRoomDocument } from '~/types/mongoose';

/**
 * Get all non-deleted messages in a message room.
 */
export const getMessages = async (
  messageRoomId: string
): Promise<MessageDocument[]> => {
  const messages = await Message.find({
    messageRoomId,
    deleted: { $ne: true },
  });
  return messages as MessageDocument[];
};

/**
 * Get unread messages for the current user in a message room.
 * Excludes messages sent by the user and messages already read.
 */
export const getUnreadMessages = async (
  messageRoomId: string,
  userId: string
): Promise<MessageDocument[]> => {
  const messages = await Message.find({
    messageRoomId,
    userId: { $ne: userId },
    readBy: { $nin: [userId] },
    deleted: { $ne: true },
  });
  return messages as MessageDocument[];
};

/**
 * Add a user to a post's message room.
 * Creates the room if it doesn't exist. Idempotent for existing members.
 */
export const addUserToPostRoom = async (
  postId: string,
  userId: string
): Promise<MessageRoomDocument> => {
  const postObjectId = new Types.ObjectId(postId);
  const userObjectId = new Types.ObjectId(userId);

  let messageRoom = await MessageRoom.findOne({
    postId: postObjectId,
    messageType: 'POST',
  }) as MessageRoomDocument | null;

  if (messageRoom) {
    const userIds = (messageRoom.users ?? []).map((u) => u.toString());

    if (!userIds.includes(userObjectId.toString())) {
      messageRoom = await MessageRoom.findByIdAndUpdate(
        messageRoom._id,
        {
          $addToSet: { users: userObjectId },
          $set: { lastActivity: new Date() },
        },
        { new: true }
      ) as MessageRoomDocument;
    } else {
      messageRoom = await MessageRoom.findByIdAndUpdate(
        messageRoom._id,
        { $set: { lastActivity: new Date() } },
        { new: true }
      ) as MessageRoomDocument;
    }
  } else {
    messageRoom = await new MessageRoom({
      users: [userObjectId],
      postId: postObjectId,
      messageType: 'POST',
      lastActivity: new Date(),
    }).save() as MessageRoomDocument;
  }

  return messageRoom;
};
