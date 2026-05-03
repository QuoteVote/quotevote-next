import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  type GraphQLFieldConfigMap,
} from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { DateScalar } from './scalars';
import { UserType } from './User';

interface TypingIndicatorShape extends Common.Typing {
  user?: Common.User;
}

export const TypingIndicatorType: GraphQLObjectType<TypingIndicatorShape, GraphQLContext> =
  new GraphQLObjectType<TypingIndicatorShape, GraphQLContext>({
    name: 'TypingIndicator',
    description: 'Live typing indicator broadcast within a message room.',
    fields: (): GraphQLFieldConfigMap<TypingIndicatorShape, GraphQLContext> => ({
      messageRoomId: { type: new GraphQLNonNull(GraphQLString) },
      userId: { type: new GraphQLNonNull(GraphQLString) },
      user: { type: UserType },
      isTyping: { type: new GraphQLNonNull(GraphQLBoolean) },
      timestamp: { type: new GraphQLNonNull(DateScalar) },
    }),
  });

interface TypingResponseShape {
  success: boolean;
}

export const TypingResponseType: GraphQLObjectType<TypingResponseShape, GraphQLContext> =
  new GraphQLObjectType<TypingResponseShape, GraphQLContext>({
    name: 'TypingResponse',
    description: 'Response payload for updateTyping mutation.',
    fields: (): GraphQLFieldConfigMap<TypingResponseShape, GraphQLContext> => ({
      success: { type: new GraphQLNonNull(GraphQLBoolean) },
    }),
  });

export const TypingIndicator = TypingIndicatorType;
