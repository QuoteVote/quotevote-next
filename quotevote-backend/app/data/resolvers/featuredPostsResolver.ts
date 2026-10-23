import { POST_RECORD_SELECT } from '~/data/utils/postPrismaMapper';
import { attachPostRelations } from './utils/posts';
import type { GraphQLContext, PostQueryArgs } from '~/types/graphql';
import type * as Common from '~/types/common';

export const featuredPostsResolver = {
  Query: {
    featuredPosts: async (
      _parent: unknown,
      args: PostQueryArgs,
      context: GraphQLContext
    ): Promise<Common.PaginatedResult<Common.Post>> => {
      const limit = args.limit ?? 10;
      const offset = args.offset ?? 0;

      const where = {
        featuredSlot: { not: null },
        deleted: { not: true },
      };

      const [totalPosts, featuredPosts] = await Promise.all([
        context.prisma.post.count({ where }),
        context.prisma.post.findMany({
          where,
          orderBy: { featuredSlot: 'asc' },
          skip: offset,
          take: limit,
          select: POST_RECORD_SELECT,
        }),
      ]);

      if (featuredPosts.length === 0) {
        return {
          entities: [],
          pagination: { total_count: totalPosts, limit, offset },
        };
      }

      const entities = await attachPostRelations(context.prisma, featuredPosts);

      return {
        entities,
        pagination: { total_count: totalPosts, limit, offset },
      };
    },
  },
};
