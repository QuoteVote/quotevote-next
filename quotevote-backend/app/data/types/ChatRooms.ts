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
import { DateScalar } from './scalars';
import { UserType } from './User';

interface ChatRoomShape extends Common.MessageRoom {
  user?: Common.User;
}

export const ChatRoomType: GraphQLObjectType<ChatRoomShape, GraphQLContext> = new GraphQLObjectType<
  ChatRoomShape,
  GraphQLContext
>({
  name: 'ChatRoom',
  description: 'Lightweight chat-room list-view projection of a MessageRoom.',
  fields: (): GraphQLFieldConfigMap<ChatRoomShape, GraphQLContext> => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    users: { type: new GraphQLList(GraphQLString), resolve: (r) => r.users ?? [] },
    messageType: { type: GraphQLString },
    created: { type: DateScalar },
    unreadMessages: { type: GraphQLInt },
    user: { type: UserType },
  }),
});

export const ChatRoom = ChatRoomType;
