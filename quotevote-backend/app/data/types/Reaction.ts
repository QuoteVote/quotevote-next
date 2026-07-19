import { GraphQLObjectType, GraphQLString, type GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { UserType } from './User';
import { MessageType } from './Message';

import User from '../models/User';
import Message from '../models/Message';

export const ReactionType: GraphQLObjectType<Common.Reaction, GraphQLContext> =
  new GraphQLObjectType<Common.Reaction, GraphQLContext>({
    name: 'Reaction',
    description: 'Emoji reaction on a message or action (vote/comment/etc).',
    fields: (): GraphQLFieldConfigMap<Common.Reaction, GraphQLContext> => ({
      _id: { type: GraphQLString },
      created: { type: GraphQLString },
      userId: { type: GraphQLString },
      messageId: { type: GraphQLString },
      actionId: { type: GraphQLString },
      emoji: { type: GraphQLString },
      user: {
        type: UserType,
        resolve: (rxn) => User.findById(rxn.userId).lean(),
      },
      message: {
        type: MessageType,
        resolve: (rxn) => Message.findById(rxn.messageId).lean(),
      },
    }),
  });

export const Reaction = ReactionType;
