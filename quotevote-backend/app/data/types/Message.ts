import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  type GraphQLFieldConfigMap,
} from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { DateScalar, JSONScalar } from './scalars';
import { UserType } from './User';

interface MessageShape extends Common.Message {
  userAvatar?: string;
}

export const MessageType: GraphQLObjectType<MessageShape, GraphQLContext> = new GraphQLObjectType<
  MessageShape,
  GraphQLContext
>({
  name: 'Message',
  description: 'Chat / direct-message entry.',
  fields: (): GraphQLFieldConfigMap<MessageShape, GraphQLContext> => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    messageRoomId: { type: GraphQLString },
    userAvatar: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (m) => m.userAvatar ?? '',
    },
    userName: { type: GraphQLString },
    userId: { type: GraphQLString },
    title: { type: GraphQLString },
    text: { type: GraphQLString },
    created: { type: DateScalar },
    type: { type: GraphQLString },
    mutation_type: { type: GraphQLString },
    deleted: { type: GraphQLBoolean },
    user: { type: UserType },
    readBy: { type: JSONScalar, resolve: (m) => m.readBy ?? [] },
  }),
});

export const Message = MessageType;
