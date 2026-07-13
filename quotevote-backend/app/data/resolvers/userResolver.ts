import User from '../models/User';
import type * as Common from '~/types/common';

export const userResolver = {
  Query: {
    user: async (
      _parent: unknown,
      args: { username: string }
    ): Promise<Common.User | null> => {
      const user = await User.findByUsername(args.username).lean();
      if (!user) return null;

      return {
        ...user,
        _id: user._id.toString(),
      } as unknown as Common.User;
    },
    searchUser: async (
      _parent: unknown,
      args: { queryName: string }
    ): Promise<Common.User[]> => {
      const queryName = args.queryName?.trim();
      if (!queryName) {
        return [];
      }

      // ponytail: escape regex special chars to prevent injection (e.g. @.* matching all users)
      const escaped = queryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      const users = await User.find({
        $or: [{ name: regex }, { username: regex }],
        accountStatus: 'active',
      })
        .limit(10)
        .lean();

      return users.map((user) => ({
        ...user,
        _id: user._id.toString(),
      })) as unknown as Common.User[];
    },
  },
};
