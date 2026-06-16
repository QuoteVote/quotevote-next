import {
  GraphQLBoolean,
  GraphQLID,
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

interface MessageShape extends Common.Message {
  userAvatar?: string;
}

export const ReadByDetailedEntryType: GraphQLObjectType<
  Common.ReadByDetailedEntry,
  GraphQLContext
> = new GraphQLObjectType<Common.ReadByDetailedEntry, GraphQLContext>({
  name: 'ReadByDetailedEntry',
  description: 'Per-user read receipt for a message.',
  fields: (): GraphQLFieldConfigMap<Common.ReadByDetailedEntry, GraphQLContext> => ({
    userId: { type: GraphQLString },
    readAt: { type: DateScalar },
  }),
});

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
    readBy: { type: new GraphQLList(GraphQLString), resolve: (m) => m.readBy ?? [] },
    readByDetailed: {
      type: new GraphQLList(ReadByDetailedEntryType),
      resolve: (m) => m.readByDetailed ?? [],
    },
  }),
});

export const Message = MessageType;
