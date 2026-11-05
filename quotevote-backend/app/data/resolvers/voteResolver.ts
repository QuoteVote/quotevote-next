import { GraphQLError } from 'graphql';
import { ActivityEventTypeValues, VOTE_TAGS } from '~/data/utils/constants';
import { checkRateLimit } from '~/data/utils/rateLimiter';
import { logActivity } from '~/data/resolvers/utils/activities';
import { addNotification } from '~/data/resolvers/utils/notifications';
import { VOTE_SELECT } from '~/data/resolvers/utils/batchLoad';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

/** Votes a member may add per minute. Repeating a response already held doesn't count. */
const VOTES_PER_MINUTE = 30;
const MINUTE_MS = 60 * 1000;

const VOTE_RECORD_SELECT = { ...VOTE_SELECT, content: true } as const;

interface VoteRecord {
  id: string;
  userId: string;
  postId: string;
  type: Common.VoteType;
  startWordIndex: number | null;
  endWordIndex: number | null;
  deleted: boolean | null;
  created: Date;
  content: string | null;
}

interface PassageVoteRow {
  _id: { $oid: string };
  tags?: unknown;
}

function isObjectId(id: string): boolean {
  return OBJECT_ID_PATTERN.test(id);
}

function isVoteTag(tag: string): tag is Common.VoteTag {
  return Object.prototype.hasOwnProperty.call(VOTE_TAGS, tag);
}

function requireUserId(context: GraphQLContext): string {
  if (!context.user?._id) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user._id.toString();
}

const badInput = (message: string): GraphQLError =>
  new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });

/** Legacy stores a vote's response as one string, Prisma writes it as a list. */
const tagOf = (tags: unknown): string | null => {
  if (typeof tags === 'string') return tags;
  if (Array.isArray(tags) && typeof tags[0] === 'string') return tags[0];
  return null;
};

const toVote = (record: VoteRecord, tag: Common.VoteTag): Common.Vote => ({
  _id: record.id,
  userId: record.userId,
  postId: record.postId,
  type: record.type,
  startWordIndex: record.startWordIndex ?? undefined,
  endWordIndex: record.endWordIndex ?? undefined,
  tags: [tag],
  content: record.content ?? undefined,
  deleted: record.deleted ?? false,
  created: record.created,
});

export const voteResolver = {
  Mutation: {
    /**
     * Passage voting (#542). Agree/Disagree, True/False and Like/Dislike are independent
     * pairs: a member holds at most one response per pair on a passage, choosing the other
     * side replaces it, and votes on other passages or pairs are left alone. Passage votes
     * don't change the post's score, which only Approve and Reject do.
     */
    addVote: async (
      _parent: unknown,
      args: { vote: Common.VoteInput },
      context: GraphQLContext
    ): Promise<Common.Vote> => {
      const userId = requireUserId(context);
      const input = args.vote;

      if (input.userId && input.userId !== userId) {
        throw new GraphQLError('You can only vote as yourself', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      if (!isObjectId(input.postId)) {
        throw badInput('Invalid postId');
      }
      const tag = input.tags?.trim() ?? '';
      if (!isVoteTag(tag)) {
        throw badInput('Unknown vote response');
      }
      const { axis, type } = VOTE_TAGS[tag];
      if (input.type !== type) {
        throw badInput(`${tag} is a ${type} vote`);
      }
      const start = input.startWordIndex;
      const end = input.endWordIndex;
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start) {
        throw badInput('Invalid passage');
      }

      const post = await context.prisma.post.findUnique({
        where: { id: input.postId },
        select: { id: true, userId: true, title: true, text: true, deleted: true },
      });
      if (!post || post.deleted) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      if (end > post.text.length) {
        throw badInput('Invalid passage');
      }

      // The member's live votes on this passage. Read raw: Prisma can't read legacy
      // `tags` strings, or keep votes that never received `deleted`.
      const rows = (await context.prisma.vote.findRaw({
        filter: {
          postId: { $oid: post.id },
          userId: { $oid: userId },
          startWordIndex: start,
          endWordIndex: end,
          deleted: { $ne: true },
        },
        options: { projection: { tags: 1 } },
      })) as unknown as PassageVoteRow[];

      const samePair = rows.filter((row) => {
        const rowTag = tagOf(row.tags);
        return rowTag !== null && isVoteTag(rowTag) && VOTE_TAGS[rowTag].axis === axis;
      });
      const held = samePair.find((row) => tagOf(row.tags) === tag);
      const replacedIds = samePair.filter((row) => row !== held).map((row) => row._id.$oid);

      if (held) {
        // Already holds this response: keep it, and clear any other side left over.
        if (replacedIds.length > 0) {
          await context.prisma.vote.updateMany({
            where: { id: { in: replacedIds } },
            data: { deleted: true },
          });
        }
        const existing = await context.prisma.vote.findUnique({
          where: { id: held._id.$oid },
          select: VOTE_RECORD_SELECT,
        });
        if (existing) return toVote(existing, tag);
      }

      try {
        await checkRateLimit(context.prisma, userId, 'addVote', VOTES_PER_MINUTE, MINUTE_MS);
      } catch {
        throw new GraphQLError('Too many votes. Please try again later.', {
          extensions: { code: 'TOO_MANY_REQUESTS' },
        });
      }

      // The stored passage comes from the post, not from the client.
      const content = post.text.slice(start, end);
      const createVote = context.prisma.vote.create({
        data: {
          userId,
          postId: post.id,
          type,
          tags: [tag],
          startWordIndex: start,
          endWordIndex: end,
          content,
          created: new Date(),
        },
        select: VOTE_RECORD_SELECT,
      });
      // Replacing the other side of the pair and adding the new response happen together.
      const created =
        replacedIds.length > 0
          ? (
              await context.prisma.$transaction([
                context.prisma.vote.updateMany({
                  where: { id: { in: replacedIds } },
                  data: { deleted: true },
                }),
                createVote,
              ])
            )[1]
          : await createVote;

      await logActivity(
        context.prisma,
        ActivityEventTypeValues.VOTED,
        { userId, postId: post.id, voteId: created.id },
        `${type === 'up' ? 'Upvoted' : 'Downvoted'} '${post.title}' post.`
      );
      if (post.userId !== userId) {
        await addNotification(context.prisma, {
          userId: post.userId,
          userIdBy: userId,
          notificationType: type === 'up' ? 'UPVOTED' : 'DOWNVOTED',
          label: content,
          postId: post.id,
        });
      }

      return toVote(created, tag);
    },

    deleteVote: async (
      _parent: unknown,
      args: { voteId: string },
      context: GraphQLContext
    ): Promise<{ _id: string }> => {
      const userId = requireUserId(context);
      const isAdmin = context.user?.admin === true;

      if (!isObjectId(args.voteId)) {
        return { _id: args.voteId };
      }

      const existing = await context.prisma.vote.findUnique({
        where: { id: args.voteId },
        select: { id: true, userId: true, deleted: true },
      });
      if (!existing) {
        return { _id: args.voteId };
      }

      if (existing.userId !== userId && !isAdmin) {
        throw new GraphQLError('Not authorized to delete this vote', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (!existing.deleted) {
        await context.prisma.vote.update({
          where: { id: args.voteId },
          data: { deleted: true },
          select: { id: true },
        });
      }

      return { _id: args.voteId };
    },
  },
  // The schema's `tags` is a String. Legacy votes hold one, new votes a list.
  Vote: {
    tags: (parent: { tags?: unknown }): string | null =>
      Array.isArray(parent.tags) ? parent.tags.join(',') : tagOf(parent.tags),
  },
};
