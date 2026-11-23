import { randomBytes } from 'crypto';
import { GraphQLError } from 'graphql';
import type { Prisma } from '@prisma/client';
import { ActivityEventTypeValues, VOTE_TAGS } from '~/data/utils/constants';
import { checkRateLimit } from '~/data/utils/rateLimiter';
import { logActivity } from '~/data/resolvers/utils/activities';
import { addNotification } from '~/data/resolvers/utils/notifications';
import { VOTE_SELECT } from '~/data/resolvers/utils/batchLoad';
import { logger } from '~/data/utils/logger';
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

interface RemainingVoteRow {
  type?: unknown;
}

/** The client inside an interactive transaction. */
type VoteTx = Prisma.TransactionClient;

/** What a vote does to the member's live votes on the passage, for one pair. */
interface PassagePlan {
  /** A live vote with the same response, kept instead of adding another. */
  held: PassageVoteRow | undefined;
  /** Live votes on the other side of the pair, replaced by this vote. */
  otherSideIds: string[];
  /** Further live votes with the same response (left by an earlier race), removed. */
  duplicateIds: string[];
}

/** What a raw command reports; failures come back here rather than being thrown. */
interface RawWriteResult {
  ok?: unknown;
  n?: unknown;
  nModified?: unknown;
  writeErrors?: { code?: unknown; errmsg?: unknown }[];
  writeConcernError?: { errmsg?: unknown };
}

/** How a write moves the post's up and down totals. */
interface CountChange {
  up: number;
  down: number;
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

/** Attempts for a vote write that MongoDB aborts because another write touched the same post. */
const MAX_WRITE_ATTEMPTS = 5;

const isWriteConflict = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 'P2034';

/**
 * Votes on one post all update that post, so concurrent votes abort each other's transaction
 * with a write conflict (P2034). Nothing from an aborted attempt is kept, and each attempt
 * reads the member's votes again inside its own transaction (#747), so a retry sees the vote
 * the other request saved instead of adding a second one.
 */
const retryOnWriteConflict = async <T>(write: () => Promise<T>): Promise<T> => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await write();
    } catch (err) {
      if (!isWriteConflict(err) || attempt >= MAX_WRITE_ATTEMPTS) throw err;
      await new Promise((resolve) => setTimeout(resolve, attempt * 10 + Math.random() * 20));
    }
  }
};

/** MongoDB's WriteConflict, which a raw write may report instead of throwing. */
const MONGO_WRITE_CONFLICT = 112;

/**
 * A raw command reports failed writes in its result instead of throwing (#747). Throw on any,
 * so the transaction aborts instead of committing totals for a write that didn't happen. A
 * write conflict is thrown as P2034, so the vote is retried like any other conflict.
 * `expected` is how many documents the command must match.
 */
const checkRawWrite = (result: unknown, what: string, expected?: number): RawWriteResult => {
  const raw = (result ?? {}) as RawWriteResult;
  const writeError = raw.writeErrors?.[0];
  if (writeError) {
    if (writeError.code === MONGO_WRITE_CONFLICT) {
      throw Object.assign(new Error(`${what}: write conflict`), { code: 'P2034' });
    }
    throw new Error(`${what} failed: ${String(writeError.errmsg ?? writeError.code)}`);
  }
  if (raw.writeConcernError) {
    throw new Error(`${what} failed: ${String(raw.writeConcernError.errmsg)}`);
  }
  if (raw.ok !== undefined && Number(raw.ok) !== 1) {
    throw new Error(`${what} failed`);
  }
  if (expected !== undefined && Number(raw.n) !== expected) {
    throw new Error(`${what} matched ${String(raw.n)} documents, expected ${expected}`);
  }
  return raw;
};

/** A new ObjectId, so the vote can be inserted raw and referenced in the same transaction. */
const newObjectId = (): string =>
  Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0') + randomBytes(8).toString('hex');

const countChange = (type: Common.VoteType, by: number): CountChange =>
  type === 'up' ? { up: by, down: 0 } : { up: 0, down: by };

const addChanges = (...changes: CountChange[]): CountChange =>
  changes.reduce((sum, c) => ({ up: sum.up + c.up, down: sum.down + c.down }), { up: 0, down: 0 });

const otherSide = (type: Common.VoteType): Common.VoteType => (type === 'up' ? 'down' : 'up');

/**
 * Soft-deletes the live votes among `ids` and returns how many it changed. Votes already
 * deleted, by a concurrent request for example, aren't counted, so the post's totals only
 * move for votes this write really removed. Raw, because Prisma's filters skip legacy votes
 * that never received `deleted`.
 */
const softDeleteVotes = async (tx: VoteTx, ids: string[]): Promise<number> => {
  if (ids.length === 0) return 0;
  const result = checkRawWrite(
    await tx.$runCommandRaw({
      update: 'votes',
      updates: [
        {
          q: { _id: { $in: ids.map((id) => ({ $oid: id })) }, deleted: { $ne: true } },
          u: { $set: { deleted: true }, $currentDate: { updatedAt: true } },
          multi: true,
        },
      ],
    }),
    'Removing votes'
  );
  return typeof result.nModified === 'number' ? result.nModified : 0;
};

/**
 * Keeps the post's `upvotes`, `downvotes` and `votedBy` in step with its live passage votes,
 * the way the current API does (`updateScore.js`), so content lists and a rollback read the
 * right totals. One pipeline update on the post, relative to what's stored, so concurrent
 * votes can't overwrite each other. `votedBy` holds one `{ type, userId }` entry per member
 * with a live vote, typed by their latest one, or drops the member when `votedByType` is null.
 * Legacy posts may hold plain ids in `votedBy`, so both shapes are matched.
 */
const updatePostCounts = async (
  tx: VoteTx,
  postId: string,
  userId: string,
  change: CountChange,
  votedByType: Common.VoteType | null
) => {
  const total = (field: string, by: number) => ({
    $max: [0, { $add: [{ $ifNull: [`$${field}`, 0] }, by] }],
  });
  const entryUserId = {
    $toString: { $cond: [{ $eq: [{ $type: '$$this' }, 'object'] }, '$$this.userId', '$$this'] },
  };
  const otherMembers = {
    $filter: {
      input: { $cond: [{ $isArray: '$votedBy' }, '$votedBy', []] },
      cond: { $ne: [entryUserId, userId] },
    },
  };
  const result = await tx.$runCommandRaw({
    update: 'posts',
    updates: [
      {
        q: { _id: { $oid: postId } },
        u: [
          {
            $set: {
              upvotes: total('upvotes', change.up),
              downvotes: total('downvotes', change.down),
              votedBy: votedByType
                ? {
                    $concatArrays: [
                      otherMembers,
                      [{ type: votedByType, userId: { $oid: userId } }],
                    ],
                  }
                : otherMembers,
            },
          },
        ],
      },
    ],
  });
  checkRawWrite(result, "Updating the post's vote totals", 1);
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
     * don't change the post's score, which only Approve and Reject do; they move the post's
     * passage vote totals (`upvotes`, `downvotes`, `votedBy`).
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
      const passageRows = async (db: VoteTx): Promise<PassageVoteRow[]> =>
        (await db.vote.findRaw({
          filter: {
            postId: { $oid: post.id },
            userId: { $oid: userId },
            startWordIndex: start,
            endWordIndex: end,
            deleted: { $ne: true },
          },
          options: { projection: { tags: 1 } },
        })) as unknown as PassageVoteRow[];

      const planFor = (rows: PassageVoteRow[]): PassagePlan => {
        const samePair = rows.filter((row) => {
          const rowTag = tagOf(row.tags);
          return rowTag !== null && isVoteTag(rowTag) && VOTE_TAGS[rowTag].axis === axis;
        });
        const held = samePair.find((row) => tagOf(row.tags) === tag);
        const others = samePair.filter((row) => row !== held);
        return {
          held,
          otherSideIds: others.filter((row) => tagOf(row.tags) !== tag).map((row) => row._id.$oid),
          duplicateIds: others.filter((row) => tagOf(row.tags) === tag).map((row) => row._id.$oid),
        };
      };

      // Repeating a response already held doesn't count against the limit. This first read
      // only decides that; the transaction below reads again and decides what to write.
      if (!planFor(await passageRows(context.prisma)).held) {
        try {
          await checkRateLimit(context.prisma, userId, 'addVote', VOTES_PER_MINUTE, MINUTE_MS);
        } catch {
          throw new GraphQLError('Too many votes. Please try again later.', {
            extensions: { code: 'TOO_MANY_REQUESTS' },
          });
        }
      }

      // The stored passage comes from the post, not from the client.
      const content = post.text.slice(start, end);

      // Reading the member's votes, replacing the other side of the pair, removing duplicates,
      // adding the new response and moving the post's totals all happen in one transaction.
      // Two identical votes at the same time both write the post, so one aborts with a write
      // conflict and its retry reads again, finds the other's vote and keeps it (#747).
      const outcome = await retryOnWriteConflict(() =>
        context.prisma.$transaction(
          async (tx): Promise<{ record: VoteRecord; created: boolean }> => {
            const plan = planFor(await passageRows(tx));
            const replaced = await softDeleteVotes(tx, plan.otherSideIds);
            // A duplicate has the same response, so it comes off its own side (#747).
            const duplicates = await softDeleteVotes(tx, plan.duplicateIds);
            const removed = addChanges(
              countChange(otherSide(type), -replaced),
              countChange(type, -duplicates)
            );

            if (plan.held) {
              // Already holds this response: keep it, and clear anything left over.
              if (replaced + duplicates > 0) {
                await updatePostCounts(tx, post.id, userId, removed, type);
              }
              const record = await tx.vote.findUnique({
                where: { id: plan.held._id.$oid },
                select: VOTE_RECORD_SELECT,
              });
              if (!record) throw new Error('The held vote could not be read');
              return { record: record as VoteRecord, created: false };
            }

            const now = new Date();
            const record: VoteRecord = {
              id: newObjectId(),
              userId,
              postId: post.id,
              type,
              startWordIndex: start,
              endWordIndex: end,
              deleted: false,
              created: now,
              content,
            };
            // Inserted raw so `tags` is the string the current API reads; Prisma's `String[]`
            // can only write a list. The collection name is the Vote model's `@@map`.
            checkRawWrite(
              await tx.$runCommandRaw({
                insert: 'votes',
                documents: [
                  {
                    _id: { $oid: record.id },
                    userId: { $oid: userId },
                    postId: { $oid: post.id },
                    type,
                    tags: tag,
                    startWordIndex: start,
                    endWordIndex: end,
                    content,
                    deleted: false,
                    created: { $date: now.toISOString() },
                    createdAt: { $date: now.toISOString() },
                    updatedAt: { $date: now.toISOString() },
                  },
                ],
              }),
              'Saving the vote',
              1
            );
            await updatePostCounts(
              tx,
              post.id,
              userId,
              addChanges(countChange(type, 1), removed),
              type
            );
            return { record, created: true };
          }
        )
      );

      if (!outcome.created) return toVote(outcome.record, tag);
      const created = outcome.record;

      // The vote is saved; a failed activity entry or notification is logged, not returned
      // as an error the member would retry (#747).
      try {
        await logActivity(
          context.prisma,
          ActivityEventTypeValues.VOTED,
          { userId, postId: post.id, voteId: created.id },
          `${type === 'up' ? 'Upvoted' : 'Downvoted'} '${post.title}' post.`
        );
      } catch (err) {
        logger.warn('addVote: failed to log the activity', {
          postId: post.id,
          voteId: created.id,
          userId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      if (post.userId !== userId) {
        try {
          await addNotification(context.prisma, {
            userId: post.userId,
            userIdBy: userId,
            notificationType: type === 'up' ? 'UPVOTED' : 'DOWNVOTED',
            label: content,
            postId: post.id,
          });
        } catch (err) {
          logger.warn('addVote: failed to notify the post author', {
            postId: post.id,
            voteId: created.id,
            userId,
            error: err instanceof Error ? err.message : String(err),
          });
        }
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
        select: { id: true, userId: true, postId: true, type: true, deleted: true },
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
        await retryOnWriteConflict(() =>
          context.prisma.$transaction(async (tx) => {
            // Only the request that really deletes the vote takes it off the totals.
            if ((await softDeleteVotes(tx, [existing.id])) === 0) return;

            // The member's latest other live vote on the post keeps them in `votedBy`.
            const [remaining] = (await tx.vote.findRaw({
              filter: {
                postId: { $oid: existing.postId },
                userId: { $oid: existing.userId },
                deleted: { $ne: true },
              },
              options: { projection: { type: 1 }, sort: { created: -1 }, limit: 1 },
            })) as unknown as RemainingVoteRow[];
            const remainingType =
              remaining?.type === 'up' || remaining?.type === 'down' ? remaining.type : null;

            await updatePostCounts(
              tx,
              existing.postId,
              existing.userId,
              countChange(existing.type, -1),
              remainingType
            );
          })
        );
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
