import { GraphQLList, GraphQLObjectType, type GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { PostType } from './Post';
import { PaginationType } from './Pagination';

export const PostsType: GraphQLObjectType<
  Common.PaginatedResult<Common.Post>,
  GraphQLContext
> = new GraphQLObjectType<Common.PaginatedResult<Common.Post>, GraphQLContext>({
  name: 'Posts',
  description: 'Paginated list of posts.',
  fields: (): GraphQLFieldConfigMap<Common.PaginatedResult<Common.Post>, GraphQLContext> => ({
    entities: {
      type: new GraphQLList(PostType),
      resolve: (r) => r.entities ?? [],
    },
    pagination: { type: PaginationType },
  }),
});

export const Posts = PostsType;
