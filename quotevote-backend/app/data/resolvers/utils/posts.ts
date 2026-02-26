import Post from '~/data/models/Post';
import type { PostDocument } from '~/types/mongoose';

/**
 * Update trending metrics for a post.
 * Resets dayPoints if the post's pointTimestamp is older than 24 hours,
 * otherwise increments dayPoints by 1.
 */
export const updateTrending = async (postId: string): Promise<void> => {
  const post = await Post.findById(postId) as PostDocument | null;
  if (!post) return;

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const isWithin24hrs =
    post.pointTimestamp instanceof Date && post.pointTimestamp >= oneDayAgo;

  if (isWithin24hrs) {
    await Post.updateOne(
      { _id: postId },
      {
        $set: {
          pointTimestamp: new Date(),
          dayPoints: (post.dayPoints ?? 0) + 1,
        },
      }
    );
  } else {
    await Post.updateOne(
      { _id: postId },
      {
        $set: {
          pointTimestamp: new Date(),
          dayPoints: 1,
        },
      }
    );
  }
};
