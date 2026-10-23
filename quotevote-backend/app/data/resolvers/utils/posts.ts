import type { PrismaClient } from '@prisma/client';
import {
  POST_CREATOR_SELECT,
  toGraphQLPost,
  type GraphQLPost,
  type PrismaPostRecord,
} from '~/data/utils/postPrismaMapper';
import type * as Common from '~/types/common';
import {
  VOTE_SELECT,
  groupIdsByPost,
  isLive,
  unique,
  whenAny,
} from '~/data/resolvers/utils/batchLoad';

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
