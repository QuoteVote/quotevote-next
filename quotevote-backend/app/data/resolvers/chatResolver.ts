import MessageRoom from '../models/MessageRoom';
import Message from '../models/Message';
import Reaction from '../models/Reaction';
import Post from '../models/Post';
import type * as Common from '~/types/common';
import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import { assertRoomAccess } from '~/data/utils/roomAccess';
import { toGraphQLError } from '~/data/utils/graphqlErrors';
import { toRoomAccessInput } from './utils/messages';

const requireUserId = (context: GraphQLContext): string => {
  if (!context.userId) {
    throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  return context.userId;
};

export const chatResolver = {
  Query: {
    messageRoom: async (
      _parent: unknown,
      args: { otherUserId: string },
      context: GraphQLContext
    ): Promise<Common.MessageRoom | null> => {
      const userId = requireUserId(context);
      const room = await MessageRoom.findOne({
        users: { $all: [userId, args.otherUserId] },
        isDirect: true,
      }).lean();
      if (!room) return null;
       try {
       assertRoomAccess(toRoomAccessInput(room), userId);
     } catch (error) {
       throw toGraphQLError(error);
     }
      return {
        ...room,
        _id: room._id.toString(),
        users: room.users.map((id) => id.toString()),
        postId: room.postId?.toString(),
      } as unknown as Common.MessageRoom;
    },

    messageRooms: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ): Promise<Common.MessageRoom[]> => {
      const userId = requireUserId(context);
      const rooms = await MessageRoom.find({ users: userId })
        .sort({ lastActivity: -1 })
        .lean();
      return rooms.map((room) => ({
        ...room,
        _id: room._id.toString(),
        users: room.users.map((id) => id.toString()),
        postId: room.postId?.toString(),
      })) as unknown as Common.MessageRoom[];
    },

    messages: async (
      _parent: unknown,
      args: { messageRoomId: string },
      context: GraphQLContext
    ): Promise<Common.Message[]> => {
      const room = await MessageRoom.findById(args.messageRoomId).lean();
      const roomAccess = toRoomAccessInput(room);

       if (roomAccess?.messageType !== 'POST' && !context.userId) {
        throw new GraphQLError('Authentication required', {
         extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        assertRoomAccess(roomAccess, context.userId ?? '');
      } catch (error) {
        throw toGraphQLError(error);
      }

      const messages = await Message.find({ 
        messageRoomId: args.messageRoomId,
        deleted: { $ne: true }, })
        .sort({ created: 1 })
        .lean();
      return messages.map((m) => ({
        ...m,
        _id: m._id.toString(),
        userId: m.userId.toString(),
        messageRoomId: m.messageRoomId.toString(),
      })) as unknown as Common.Message[];
    },

    messageReactions: async (
      _parent: unknown,
      args: { messageId: string }
    ): Promise<Common.Reaction[]> => {
      const reactions = await Reaction.find({ messageId: args.messageId }).lean();
      return reactions.map((r) => ({
        ...r,
        _id: r._id.toString(),
        userId: r.userId.toString(),
        messageId: r.messageId.toString(),
      })) as unknown as Common.Reaction[];
    },
  },

  MessageRoom: {
    postDetails: async (parent: Common.MessageRoom) => {
      if (!parent.postId) return null;
      const post = await Post.findById(parent.postId).lean();
      if (!post) return null;
      return {
        title: post.title,
        text: post.text,
      };
    },
    messages: async (parent: Common.MessageRoom) => {
      const messages = await Message.find({ messageRoomId: parent._id })
        .sort({ created: 1 })
        .lean();
      return messages.map((m) => ({
        ...m,
        _id: m._id.toString(),
        userId: m.userId.toString(),
        messageRoomId: m.messageRoomId.toString(),
      }));
    },
  },
};
