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
import { MessageRoomType } from './MessageRoom';
import { ReactionType } from './Reaction';
import { PresenceType } from './Presence';
import { MessageTypeEnum } from './enums';

import User from '../models/User';
import MessageRoom from '../models/MessageRoom';
import Reaction from '../models/Reaction';
import Presence from '../models/Presence';

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
    type: { type: MessageTypeEnum },
    mutation_type: { type: GraphQLString },
    deleted: { type: GraphQLBoolean },
    user: {
      type: UserType,
      resolve: (msg) => (msg as any).user ?? User.findById(msg.userId).lean(),
    },
    messageRoom: {
      type: MessageRoomType,
      resolve: (msg) => MessageRoom.findById(msg.messageRoomId).lean(),
    },
    reactions: {
      type: new GraphQLList(ReactionType),
      resolve: (msg) => Reaction.find({ messageId: msg._id }).lean(),
    },
    presence: {
      type: PresenceType,
      resolve: (msg) => Presence.findOne({ userId: msg.userId }).lean(),
    },
    readBy: { type: new GraphQLList(GraphQLString), resolve: (m) => m.readBy ?? [] },
    readByDetailed: {
      type: new GraphQLList(ReadByDetailedEntryType),
      resolve: (m) => m.readByDetailed ?? [],
    },
  }),
});

export const Message = MessageType;
