import { GraphQLList, GraphQLObjectType, type GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { ActivityType } from './Activity';
import { PaginationType } from './Pagination';

export const ActivitiesType: GraphQLObjectType<
  Common.PaginatedResult<Common.Activity>,
  GraphQLContext
> = new GraphQLObjectType<Common.PaginatedResult<Common.Activity>, GraphQLContext>({
  name: 'Activities',
  description: 'Paginated list of activity feed entries.',
  fields: (): GraphQLFieldConfigMap<Common.PaginatedResult<Common.Activity>, GraphQLContext> => ({
    entities: {
      type: new GraphQLList(ActivityType),
      resolve: (r) => r.entities ?? [],
    },
    pagination: { type: PaginationType },
  }),
});

export const Activities = ActivitiesType;
