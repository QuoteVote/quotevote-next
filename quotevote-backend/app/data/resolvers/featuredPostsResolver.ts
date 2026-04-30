import mongoose from 'mongoose';
import Post from '../models/Post';
import User from '../models/User';

interface FeaturedPostsArgs {
  limit?: number;
  offset?: number;
}

export const featuredPostsResolver = {
  Query: {
    featuredPosts: async (
      _parent: unknown,
      args: FeaturedPostsArgs,
    ): Promise<{
      entities: unknown[];
      pagination: { total_count: number; limit: number; offset: number };
    }> => {
      const limit = args.limit ?? 10;
      const offset = args.offset ?? 0;

      const searchArgs = {
        featuredSlot: { $ne: null, $exists: true },
        deleted: { $ne: true },
      };

      const [totalPosts, featuredPosts] = await Promise.all([
        Post.countDocuments(searchArgs),
        Post.find(searchArgs).sort({ featuredSlot: 1 }).skip(offset).limit(limit).lean(),
      ]);

      if (featuredPosts.length === 0) {
        return {
          entities: [],
          pagination: { total_count: totalPosts, limit, offset },
        };
      }

      const uniqueUserIds = [
        ...new Set(featuredPosts.map((p) => p.userId.toString())),
      ].map((id) => new mongoose.Types.ObjectId(id));

      const creators = await User.find({ _id: { $in: uniqueUserIds } })
        .select('_id name username avatar')
        .lean();

      const creatorMap = new Map(creators.map((c) => [c._id.toString(), c]));

      const entities = featuredPosts.map((post) => ({
        ...post,
        _id: post._id.toString(),
        userId: post.userId.toString(),
        groupId: post.groupId.toString(),
        creator: creatorMap.get(post.userId.toString()) ?? null,
        votedBy: Array.isArray(post.votedBy) ? post.votedBy : [],
      }));

      return {
        entities,
        pagination: { total_count: totalPosts, limit, offset },
      };
    },
  },
};
