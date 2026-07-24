import * as bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import User from '../models/User';
import { normalizeBio } from '../utils/bioValidation';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';

type UpdateUserInput = {
  _id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  password?: string | null;
  avatar?: string | null;
  bio?: string | null;
  contributorBadge?: boolean | null;
  themePreference?: string | null;
};

function toPublicUser(user: {
  _id: { toString(): string } | string;
  reputation?: Common.Reputation | null;
  [key: string]: unknown;
}): Common.User {
  const userId = typeof user._id === 'string' ? user._id : user._id.toString();
  return {
    ...user,
    _id: userId,
    reputation: user.reputation
      ? { ...user.reputation, _id: user.reputation._id ?? userId }
      : undefined,
  } as unknown as Common.User;
}

function asPublicUserDoc(user: unknown): Common.User {
  return toPublicUser(user as {
    _id: { toString(): string } | string;
    reputation?: Common.Reputation | null;
    [key: string]: unknown;
  });
}

export const userResolver = {
  Query: {
    user: async (
      _parent: unknown,
      args: { username: string }
    ): Promise<Common.User | null> => {
      // `user` is a public (unauthenticated) query — select only public-profile
      // fields so this can't be used to harvest email addresses or other
      // sensitive data, and match searchUser's active-account filter.
      const user = await User.findOne({
        username: args.username?.trim(),
        accountStatus: 'active',
      })
        .select(
          '_id name username avatar bio contributorBadge upvotes downvotes _followingId _followersId reputation'
        )
        .lean();
      if (!user) return null;

      return asPublicUserDoc(user);
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
        .select(
          '_id name username avatar bio contributorBadge upvotes downvotes _followingId _followersId reputation'
        )
        .limit(10)
        .lean();

      return users.map((user) => asPublicUserDoc(user));
    },
  },
  Mutation: {
    updateUser: async (
      _parent: unknown,
      args: { user: UpdateUserInput },
      context: GraphQLContext
    ): Promise<Common.User> => {
      if (!context.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const input = args.user;
      if (!input?._id) {
        throw new GraphQLError('User id is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const actorId = context.user._id.toString();
      const targetId = input._id.toString();
      const isOwnProfile = actorId === targetId;
      const isAdmin = context.user.admin === true;

      if (!isOwnProfile && !isAdmin) {
        throw new GraphQLError('Not authorized to update this user', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Admins updating another user may only toggle contributorBadge.
      if (!isOwnProfile && isAdmin) {
        if (input.contributorBadge === undefined || input.contributorBadge === null) {
          throw new GraphQLError('Admins may only update contributorBadge for other users', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const adminUpdated = await User.findByIdAndUpdate(
          targetId,
          { $set: { contributorBadge: Boolean(input.contributorBadge) } },
          { new: true }
        ).lean();

        if (!adminUpdated) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        return asPublicUserDoc(adminUpdated);
      }

      const updates: Record<string, unknown> = {};

      if (input.name !== undefined && input.name !== null) {
        const name = input.name.trim();
        if (!name) {
          throw new GraphQLError('Name is required', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        if (name.length > 50) {
          throw new GraphQLError('Name must be under 50 characters', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        updates.name = name;
      }

      if (input.username !== undefined && input.username !== null) {
        const username = input.username.trim();
        if (username.length < 4 || username.length > 50) {
          throw new GraphQLError('Username must be between 4 and 50 characters', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        const existingUsername = await User.findOne({
          _id: { $ne: targetId },
          username,
        })
          .select('_id')
          .lean();
        if (existingUsername) {
          throw new GraphQLError('Username already exists!', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        updates.username = username;
      }

      if (input.email !== undefined && input.email !== null) {
        const email = input.email.trim().toLowerCase();
        if (!email) {
          throw new GraphQLError('Email is required', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        const existingEmail = await User.findOne({
          _id: { $ne: targetId },
          email,
        })
          .select('_id')
          .lean();
        if (existingEmail) {
          throw new GraphQLError('Email address already exists!', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        updates.email = email;
      }

      if (input.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(input.password, salt);
      }

      if (input.avatar !== undefined && input.avatar !== null) {
        updates.avatar = input.avatar;
      }

      if (input.bio !== undefined) {
        try {
          updates.bio = normalizeBio(input.bio);
        } catch (err) {
          throw new GraphQLError(err instanceof Error ? err.message : 'Invalid About text', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
      }

      if (input.themePreference !== undefined && input.themePreference !== null) {
        const theme = input.themePreference.trim();
        if (theme !== 'light' && theme !== 'dark') {
          throw new GraphQLError('themePreference must be light or dark', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        updates.themePreference = theme;
      }

      if (input.contributorBadge !== undefined && input.contributorBadge !== null) {
        if (!isAdmin) {
          throw new GraphQLError('Only admins can update contributorBadge', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        updates.contributorBadge = Boolean(input.contributorBadge);
      }

      if (Object.keys(updates).length === 0) {
        const current = await User.findById(targetId).lean();
        if (!current) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return asPublicUserDoc(current);
      }

      const updated = await User.findByIdAndUpdate(targetId, { $set: updates }, { new: true }).lean();

      if (!updated) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return asPublicUserDoc(updated);
    },

    updateUserAvatar: async (
      _parent: unknown,
      args: { user_id: string; avatarQualities?: Record<string, unknown> | null },
      context: GraphQLContext
    ): Promise<Common.User> => {
      if (!context.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const targetId = args.user_id?.toString();
      if (!targetId) {
        throw new GraphQLError('User id is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const actorId = context.user._id.toString();
      const isAdmin = context.user.admin === true;
      if (actorId !== targetId && !isAdmin) {
        throw new GraphQLError('Not authorized to update this avatar', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (
        args.avatarQualities === undefined ||
        args.avatarQualities === null ||
        typeof args.avatarQualities !== 'object' ||
        Array.isArray(args.avatarQualities)
      ) {
        throw new GraphQLError('avatarQualities must be an object', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const updated = await User.findByIdAndUpdate(
        targetId,
        { $set: { avatar: args.avatarQualities } },
        { new: true }
      ).lean();

      if (!updated) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return asPublicUserDoc(updated);
    },
  },
};
