/**
 * GraphQL Query resolvers for Tag (community).
 *
 * Domain & Collection data-access audit (#500 / 7.77.7):
 * - Domain: Mongoose Domain model exists (`app/data/models/Domain.ts`), and Prisma model
 *   exists (`prisma/schema/content.prisma`), but there are no executable GraphQL Query or
 *   Mutation resolver paths on current main. Unused by retained executable paths.
 * - Collection: Mongoose Collection model exists (`app/data/models/Collection.ts`), and
 *   Prisma model exists (`prisma/schema/content.prisma`), but there are no executable
 *   GraphQL Query or Mutation resolver paths on current main (Solid Pods portable state
 *   uses its own embedded schema in `app/solid/`). Unused by retained executable paths.
 * - Per issue instructions, speculative resolvers are not introduced.
 */

import { Prisma } from '@prisma/client';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { isObjectId, toCommonTag, TAG_RECORD_SELECT } from '~/data/utils/tagPrismaMapper';

export interface TagArgs {
  tagId: string;
}

export interface TagsArgs {
  limit?: number;
  created?: string;
  key?: string;
  title?: string;
}

export const tagResolver = {
  Query: {
    tag: async (
      _parent: unknown,
      args: TagArgs,
      context: GraphQLContext
    ): Promise<Common.Tag | null> => {
      if (!args.tagId || !isObjectId(args.tagId)) {
        return null;
      }

      const tag = await context.prisma.tag.findUnique({
        where: { id: args.tagId },
        select: TAG_RECORD_SELECT,
      });

      if (!tag) return null;
      return toCommonTag(tag);
    },

    tags: async (
      _parent: unknown,
      args: TagsArgs,
      context: GraphQLContext
    ): Promise<Common.Tag[]> => {
      const where: Prisma.TagWhereInput = {};

      if (args.title) {
        where.title = args.title;
      }

      if (args.created) {
        const createdDate = new Date(args.created);
        if (!isNaN(createdDate.getTime())) {
          where.created = createdDate;
        }
      }

      const take = typeof args.limit === 'number' && args.limit >= 0 ? args.limit : undefined;

      const tags = await context.prisma.tag.findMany({
        ...(Object.keys(where).length > 0 ? { where } : {}),
        ...(take !== undefined ? { take } : {}),
        select: TAG_RECORD_SELECT,
      });

      return tags.map(toCommonTag);
    },
  },
};
