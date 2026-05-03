import { GraphQLInt, GraphQLObjectType, type GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';

export const PaginationType: GraphQLObjectType<Common.Pagination, GraphQLContext> =
  new GraphQLObjectType<Common.Pagination, GraphQLContext>({
    name: 'Pagination',
    description: 'Cursor / offset pagination metadata returned alongside list queries.',
    fields: (): GraphQLFieldConfigMap<Common.Pagination, GraphQLContext> => ({
      total_count: { type: GraphQLInt },
      limit: { type: GraphQLInt },
      offset: { type: GraphQLInt },
    }),
  });

export const Pagination = PaginationType;
