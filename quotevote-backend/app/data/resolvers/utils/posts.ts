import type { PrismaClient } from '@prisma/client';
import {
  POST_CREATOR_SELECT,
  toGraphQLPost,
  type GraphQLPost,
  type PrismaPostCreator,
  type PrismaPostRecord,
} from '~/data/utils/postPrismaMapper';
import type * as Common from '~/types/common';
import type { PostDetail } from '~/types/graphql';
import {
  VOTE_SELECT,
  groupIdsByPost,
  isLive,
  unique,
  whenAny,
} from '~/data/resolvers/utils/batchLoad';
import {
  COMMENT_SELECT,
  QUOTE_SELECT,
  toComment,
  toQuote,
} from '~/data/resolvers/utils/commentsQuotes';

type TrendingPrisma = Pick<PrismaClient, 'post'>;
type PostsPrisma = Pick<PrismaClient, 'user' | 'vote' | 'comment' | 'quote' | 'messageRoom'>;

/**
 * Update trending metrics for a post.
 * Resets dayPoints if the post's pointTimestamp is older than 24 hours,
 * otherwise increments dayPoints by 1.
 */
export const updateTrending = async (prisma: TrendingPrisma, postId: string): Promise<void> => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { pointTimestamp: true, dayPoints: true },
  });
  if (!post) return;

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const isWithin24hrs = post.pointTimestamp instanceof Date && post.pointTimestamp >= oneDayAgo;

  // Select only id so Prisma does not re-read the full legacy post (missing
  // createdAt) after the update — addComment/addQuote are the only callers.
  await prisma.post.update({
    where: { id: postId },
    data: {
      pointTimestamp: new Date(),
      dayPoints: isWithin24hrs ? (post.dayPoints ?? 0) + 1 : 1,
    },
    select: { id: true },
  });
};

/**
 * Load what a post card shows for a page of posts: the author, the votes with
 * their passage, comment and quote ids for the counts, and the post's chat room
 * (its messages come from the MessageRoom resolver). Uses a fixed number of
 * queries per page instead of several per post. Deleted votes, comments and
 * quotes are left out.
 */
export async function attachPostRelations(
  prisma: PostsPrisma,
  posts: PrismaPostRecord[]
): Promise<GraphQLPost[]> {
  if (posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);
  const idAndPost = { id: true, postId: true, deleted: true } as const;

  const [creators, votes, comments, quotes, rooms] = await Promise.all([
    whenAny(unique(posts.map((p) => p.userId)), (ids) =>
      prisma.user.findMany({ where: { id: { in: ids } }, select: POST_CREATOR_SELECT })
    ),
    prisma.vote.findMany({ where: { postId: { in: postIds } }, select: VOTE_SELECT }),
    prisma.comment.findMany({ where: { postId: { in: postIds } }, select: idAndPost }),
    prisma.quote.findMany({ where: { postId: { in: postIds } }, select: idAndPost }),
    prisma.messageRoom.findMany({
      where: { postId: { in: postIds } },
      select: { id: true, postId: true },
    }),
  ]);

  const creatorMap = new Map(creators.map((c) => [c.id, c]));
  const votesByPost = new Map<string, Common.Vote[]>();
  for (const v of votes.filter(isLive)) {
    const list = votesByPost.get(v.postId) ?? [];
    list.push({
      _id: v.id,
      userId: v.userId,
      postId: v.postId,
      type: v.type,
      startWordIndex: v.startWordIndex ?? undefined,
      endWordIndex: v.endWordIndex ?? undefined,
      created: v.created,
    });
    votesByPost.set(v.postId, list);
  }
  const commentsByPost = groupIdsByPost(comments);
  const quotesByPost = groupIdsByPost(quotes);
  // Legacy reads a post's room with findOne, so the first one wins.
  const roomByPost = new Map<string, { _id: string; postId: string }>();
  for (const room of rooms) {
    if (room.postId && !roomByPost.has(room.postId)) {
      roomByPost.set(room.postId, { _id: room.id, postId: room.postId });
    }
  }

  return posts.map((post) => ({
    ...toGraphQLPost(post, creatorMap.get(post.userId) ?? null),
    votes: votesByPost.get(post.id) ?? [],
    comments: commentsByPost.get(post.id) ?? [],
    quotes: quotesByPost.get(post.id) ?? [],
    messageRoom: roomByPost.get(post.id) ?? null,
  }));
}

type PostDetailPrisma = Pick<PrismaClient, 'user' | 'vote' | 'comment' | 'quote' | 'messageRoom'>;

const toAuthor = (user: PrismaPostCreator | undefined): Common.User | null =>
  user
    ? ({
        _id: user.id,
        name: user.name ?? undefined,
        username: user.username ?? undefined,
        avatar: (user.avatar as string | Record<string, unknown> | undefined) ?? undefined,
        contributorBadge: user.contributorBadge ?? false,
      } as Common.User)
    : null;

const rawId = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '$oid' in value) {
    const oid = (value as { $oid: unknown }).$oid;
    return typeof oid === 'string' ? oid : null;
  }
  return null;
};

/**
 * Legacy stores a vote's `tags` as one string, which Prisma can't read as the
 * list the model declares, so read the raw field and return it as a string.
 */
async function loadVoteTags(
  prisma: PostDetailPrisma,
  postId: string
): Promise<Map<string, string>> {
  const rows = (await prisma.vote.findRaw({
    filter: { postId: { $oid: postId } },
    options: { projection: { tags: 1 } },
  })) as unknown as { _id: unknown; tags?: unknown }[];

  const tagsById = new Map<string, string>();
  for (const row of rows) {
    const id = rawId(row._id);
    if (!id) continue;
    if (typeof row.tags === 'string') tagsById.set(id, row.tags);
    else if (Array.isArray(row.tags)) tagsById.set(id, row.tags.join(','));
  }
  return tagsById;
}

/**
 * Load everything the post page shows for one post: its author, and its votes,
 * comments and quotes with their authors, plus the post's chat room. Deleted
 * votes, comments and quotes are left out, as legacy does. Users are read with
 * the public author fields only.
 */
export async function attachPostDetail(
  prisma: PostDetailPrisma,
  post: PrismaPostRecord
): Promise<PostDetail> {
  const [votes, voteTags, comments, quotes, room] = await Promise.all([
    prisma.vote.findMany({
      where: { postId: post.id },
      select: { ...VOTE_SELECT, content: true },
      orderBy: { created: 'asc' },
    }),
    loadVoteTags(prisma, post.id),
    prisma.comment.findMany({
      where: { postId: post.id },
      select: COMMENT_SELECT,
      orderBy: { created: 'asc' },
    }),
    prisma.quote.findMany({
      where: { postId: post.id },
      select: QUOTE_SELECT,
      orderBy: { created: 'asc' },
    }),
    // The first (oldest) room wins, as in legacy's findOne and when someone joins (#790).
    prisma.messageRoom.findFirst({
      where: { postId: post.id },
      orderBy: { id: 'asc' },
      select: { id: true, postId: true, userIds: true, messageType: true, created: true },
    }),
  ]);

  const liveVotes = votes.filter(isLive);
  const liveComments = comments.filter(isLive);
  const liveQuotes = quotes.filter(isLive);

  const userIds = unique([
    post.userId,
    ...liveVotes.map((v) => v.userId),
    ...liveComments.map((c) => c.userId),
    ...liveQuotes.map((q) => q.userId),
  ]);
  const users = await whenAny(userIds, (ids) =>
    prisma.user.findMany({ where: { id: { in: ids } }, select: POST_CREATOR_SELECT })
  );
  const userMap = new Map(users.map((u) => [u.id, u]));

  return {
    ...toGraphQLPost(post, userMap.get(post.userId) ?? null),
    votes: liveVotes.map((v) => ({
      _id: v.id,
      userId: v.userId,
      postId: v.postId,
      type: v.type,
      startWordIndex: v.startWordIndex ?? undefined,
      endWordIndex: v.endWordIndex ?? undefined,
      content: v.content ?? undefined,
      created: v.created,
      tags: voteTags.get(v.id) ?? null,
      user: toAuthor(userMap.get(v.userId)),
    })),
    comments: liveComments.map((c) => ({
      ...toComment(c),
      user: toAuthor(userMap.get(c.userId)),
    })),
    quotes: liveQuotes.map((q) => ({ ...toQuote(q), user: toAuthor(userMap.get(q.userId)) })),
    messageRoom: room
      ? {
          _id: room.id,
          postId: room.postId ?? undefined,
          users: room.userIds,
          messageType: room.messageType,
          created: room.created,
        }
      : null,
  };
}
