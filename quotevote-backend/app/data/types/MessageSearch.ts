import {
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

export interface MessageSearchHit {
  _id: string;
  messageRoomId: string;
  created: Date;
  snippet: string;
  user: Common.User | null;
}

export interface MessageSearchResult {
  results: MessageSearchHit[];
  nextCursor: string | null;
}

export const MessageSearchHitType: GraphQLObjectType<MessageSearchHit, GraphQLContext> =
  new GraphQLObjectType<MessageSearchHit, GraphQLContext>({
    name: 'MessageSearchHit',
    description: 'A message that matched a text search, with a short snippet around the match.',
    fields: (): GraphQLFieldConfigMap<MessageSearchHit, GraphQLContext> => ({
      _id: { type: new GraphQLNonNull(GraphQLID) },
      messageRoomId: { type: new GraphQLNonNull(GraphQLString) },
      created: { type: DateScalar },
      snippet: { type: new GraphQLNonNull(GraphQLString) },
      user: { type: UserType },
    }),
  });

export const MessageSearchResultType: GraphQLObjectType<MessageSearchResult, GraphQLContext> =
  new GraphQLObjectType<MessageSearchResult, GraphQLContext>({
    name: 'MessageSearchResult',
    description: 'One page of message search results. nextCursor is null on the last page.',
    fields: (): GraphQLFieldConfigMap<MessageSearchResult, GraphQLContext> => ({
      results: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(MessageSearchHitType))),
      },
      nextCursor: { type: GraphQLString },
    }),
  });
