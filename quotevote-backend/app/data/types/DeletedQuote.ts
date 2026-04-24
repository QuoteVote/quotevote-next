import { GraphQLObjectType, GraphQLString, type GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';

interface DeletedIdPayload {
  _id?: string;
}

export const DeletedQuoteType: GraphQLObjectType<DeletedIdPayload, GraphQLContext> =
  new GraphQLObjectType<DeletedIdPayload, GraphQLContext>({
    name: 'DeletedQuote',
    description: 'Response payload for a soft-deleted Quote mutation.',
    fields: (): GraphQLFieldConfigMap<DeletedIdPayload, GraphQLContext> => ({
      _id: { type: GraphQLString },
    }),
  });

export const DeletedQuote = DeletedQuoteType;
