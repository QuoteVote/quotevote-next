/**
 * GraphQL Query / Mutation resolvers for Tag (community).
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

import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { isObjectId, toCommonTag, TAG_RECORD_SELECT } from '~/data/utils/tagPrismaMapper';
import { checkRateLimit } from '~/data/utils/rateLimiter';

const TAG_PRIVACY_VALUES: ReadonlySet<Common.TagPrivacy> = new Set([
  'public',
  'private',
  'restricted',
]);

/** Caps for createTag so oversized titles don't flood every member's tag picker. */
export const MAX_TAG_TITLE_LENGTH = 50;
export const MAX_TAG_DESCRIPTION_LENGTH = 500;

/** Tags a member may create per hour. */
const TAGS_PER_HOUR = 10;
const HOUR_MS = 60 * 60 * 1000;

export interface TagArgs {
  tagId: string;
}

export interface TagsArgs {
  limit?: number;
  created?: string;
  key?: string;
  title?: string;
}

function requireUserId(context: GraphQLContext): string {
  if (!context.user?._id) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user._id.toString();
}

/** Legacy createGroup URL: `/{title-with-spaces-as-dashes}`. */
function tagUrlFromTitle(title: string): string {
  return `/${title.replace(/ /g, '-').toLowerCase()}`;
}

function isTagPrivacy(value: string): value is Common.TagPrivacy {
  return TAG_PRIVACY_VALUES.has(value as Common.TagPrivacy);
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

  Mutation: {
    /**
     * Creates a Tag (legacy `createGroup`). Caller becomes creator, admin, and
     * allowed member. Title must be unique; URL is derived from the title.
     */
    createTag: async (
      _parent: unknown,
      args: { tag: Common.TagInput },
      context: GraphQLContext
    ): Promise<Common.Tag> => {
      const actorId = requireUserId(context);
      const input = args.tag;

      if (!input?.title?.trim()) {
        throw new GraphQLError('Tag title is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (!input.description?.trim()) {
        throw new GraphQLError('Tag description is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (!input.privacy || !isTagPrivacy(input.privacy)) {
        throw new GraphQLError('Invalid tag privacy', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Prefer the session user; reject spoofed creators (hardening vs legacy).
      if (input.creatorId && isObjectId(input.creatorId) && input.creatorId !== actorId) {
        throw new GraphQLError('Not authorized to create a tag as another user', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const title = input.title.trim();
      const description = input.description.trim();

      if (title.length > MAX_TAG_TITLE_LENGTH) {
        throw new GraphQLError(`Tag title must be at most ${MAX_TAG_TITLE_LENGTH} characters`, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (description.length > MAX_TAG_DESCRIPTION_LENGTH) {
        throw new GraphQLError(
          `Tag description must be at most ${MAX_TAG_DESCRIPTION_LENGTH} characters`,
          {
            extensions: { code: 'BAD_USER_INPUT' },
          }
        );
      }

      const url = tagUrlFromTitle(title);

      // Titles that differ only in case or spacing share a URL, so check both.
      const existing = await context.prisma.tag.findFirst({
        where: { OR: [{ title }, { url }] },
        select: { id: true },
      });
      if (existing) {
        throw new GraphQLError('Tag name already exist!', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // After validation so refused attempts don't consume the hourly budget.
      try {
        await checkRateLimit(context.prisma, actorId, 'createTag', TAGS_PER_HOUR, HOUR_MS);
      } catch {
        throw new GraphQLError('Too many tags. Please try again later.', {
          extensions: { code: 'TOO_MANY_REQUESTS' },
        });
      }

      const created = await context.prisma.tag.create({
        data: {
          creatorId: actorId,
          title,
          description,
          privacy: input.privacy,
          adminIds: [actorId],
          allowedUserIds: [actorId],
          url,
          created: new Date(),
        },
        select: TAG_RECORD_SELECT,
      });

      return toCommonTag(created);
    },
  },
};
