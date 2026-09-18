import Tag from '../models/Tag';
import type * as Common from '~/types/common';

export const tagResolver = {
  Query: {
    tag: async (
      _parent: unknown,
      args: { tagId: string }
    ): Promise<Common.Tag | null> => {
      const tag = await Tag.findById(args.tagId).lean();
      if (!tag) return null;
      return {
        ...tag,
        _id: tag._id.toString(),
        creatorId: tag.creatorId.toString(),
        adminIds: tag.adminIds?.map((id) => id.toString()) || [],
        allowedUserIds: tag.allowedUserIds?.map((id) => id.toString()) || [],
      } as unknown as Common.Tag;
    },
    tags: async (
      _parent: unknown,
      args: { limit: number }
    ): Promise<Common.Tag[]> => {
      const tags = await Tag.find({}).limit(args.limit).lean();
      return tags.map((t) => ({
        ...t,
        _id: t._id.toString(),
        creatorId: t.creatorId.toString(),
        adminIds: t.adminIds?.map((id) => id.toString()) || [],
        allowedUserIds: t.allowedUserIds?.map((id) => id.toString()) || [],
      })) as unknown as Common.Tag[];
    },
  },
};
