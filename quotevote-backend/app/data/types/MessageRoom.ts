import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  type GraphQLFieldConfigMap,
} from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { DateScalar, JSONScalar } from './scalars';
import { MessageType } from './Message';

interface PostDetailsShape {
  _id?: string;
  title?: string;
  text?: string;
  userId?: string;
  url?: string;
}

export const PostDetailsType: GraphQLObjectType<PostDetailsShape, GraphQLContext> =
  new GraphQLObjectType<PostDetailsShape, GraphQLContext>({
    name: 'PostDetails',
    description: 'Inlined Post snapshot displayed with the MessageRoom that wraps it.',
    fields: (): GraphQLFieldConfigMap<PostDetailsShape, GraphQLContext> => ({
      _id: { type: GraphQLID },
      title: { type: GraphQLString },
      text: { type: GraphQLString },
      userId: { type: GraphQLID },
      url: { type: GraphQLString },
    }),
  });

interface MessageRoomShape extends Common.MessageRoom {
  messages?: Common.Message[];
  postDetails?: PostDetailsShape;
}

export const MessageRoomType: GraphQLObjectType<MessageRoomShape, GraphQLContext> =
  new GraphQLObjectType<MessageRoomShape, GraphQLContext>({
    name: 'MessageRoom',
    description: 'Chat room (direct or group), aligned with Prisma MessageRoom.',
    fields: (): GraphQLFieldConfigMap<MessageRoomShape, GraphQLContext> => ({
      _id: { type: new GraphQLNonNull(GraphQLID) },
      users: { type: JSONScalar, resolve: (r) => r.users ?? [] },
      messageType: { type: GraphQLString },
      created: { type: DateScalar },
      lastActivity: { type: DateScalar },
      lastMessageTime: { type: DateScalar },
      title: { type: GraphQLString },
      avatar: { type: JSONScalar },
      unreadMessages: { type: GraphQLInt },
      postId: { type: GraphQLString },
      messages: {
        type: new GraphQLList(MessageType),
        resolve: (r) => r.messages ?? [],
      },
      postDetails: { type: PostDetailsType },
    }),
  });

export const MessageRoom = MessageRoomType;
