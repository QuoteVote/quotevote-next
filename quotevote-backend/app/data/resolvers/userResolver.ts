import * as bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { normalizeBio } from '../utils/bioValidation';
import { toPublicUser, type PrismaUserRecord } from '~/data/utils/userPrismaMapper';
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

/**
 * Public profile fields — mirrors the Mongoose .select() whitelist.
 * Prisma field names (not the @map names): followingIds, followerIds, etc.
 * The mapper translates to legacy shape (_followingId, _followersId, etc.)
 */
const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  avatar: true,
  bio: true,
  contributorBadge: true,
  upvotes: true,
  downvotes: true,
  followingIds: true,
  followerIds: true,
  reputation: true,
} as const;

export const userResolver = {
  Query: {
    user: async (
      _parent: unknown,
      args: { username: string },
      context: GraphQLContext
    ): Promise<Common.User | null> => {
      // `user` is a public (unauthenticated) query — select only public-profile
      // fields so this can't be used to harvest email addresses or other
      // sensitive data, and match searchUser's active-account filter.
      const user = await context.prisma.user.findFirst({
        where: {
          username: args.username?.trim(),
          accountStatus: 'active',
        },
        select: PUBLIC_USER_SELECT,
      });

      if (!user) return null;
      return toPublicUser(user as PrismaUserRecord);
    },

    searchUser: async (
      _parent: unknown,
      args: { queryName: string },
      context: GraphQLContext
    ): Promise<Common.User[]> => {
      const queryName = args.queryName?.trim();
      if (!queryName) {
        return [];
      }

      // Prisma's contains + mode: 'insensitive' is safe from injection —
      // the string is parameterized, never interpreted as a pattern.
      // This replaces the old Mongoose regex-escape approach.
      const users = await context.prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: queryName, mode: 'insensitive' } },
            { username: { contains: queryName, mode: 'insensitive' } },
          ],
          accountStatus: 'active',
        },
        select: PUBLIC_USER_SELECT,
        take: 10,
      });

      return users.map((u) => toPublicUser(u as PrismaUserRecord));
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

        try {
          const adminUpdated = await context.prisma.user.update({
            where: { id: targetId },
            data: { contributorBadge: Boolean(input.contributorBadge) },
          });
          return toPublicUser(adminUpdated as PrismaUserRecord);
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            throw new GraphQLError('User not found', {
              extensions: { code: 'NOT_FOUND' },
            });
          }
          throw err;
        }
      }

      const updates: Prisma.UserUpdateInput = {};

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

        const existingUsername = await context.prisma.user.findFirst({
          where: {
            username,
            NOT: { id: targetId },
          },
          select: { id: true },
        });

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

        const existingEmail = await context.prisma.user.findFirst({
          where: {
            email,
            NOT: { id: targetId },
          },
          select: { id: true },
        });

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

      // TODO: themePreference field doesn't exist in Prisma schema yet.
      // Mongoose silently dropped it (strict mode). To match current behavior,
      // we skip it here. Once P0 (schema migration) is done, uncomment this.
      // if (input.themePreference !== undefined && input.themePreference !== null) {
      //   const theme = input.themePreference.trim();
      //   if (theme !== 'light' && theme !== 'dark') {
      //     throw new GraphQLError('themePreference must be light or dark', {
      //       extensions: { code: 'BAD_USER_INPUT' },
      //     });
      //   }
      //   updates.themePreference = theme;
      // }

      if (input.contributorBadge !== undefined && input.contributorBadge !== null) {
        if (!isAdmin) {
          throw new GraphQLError('Only admins can update contributorBadge', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        updates.contributorBadge = Boolean(input.contributorBadge);
      }

      if (Object.keys(updates).length === 0) {
        const current = await context.prisma.user.findUnique({
          where: { id: targetId },
        });
        if (!current) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return toPublicUser(current as PrismaUserRecord);
      }

      try {
        const updated = await context.prisma.user.update({
          where: { id: targetId },
          data: updates,
        });
        return toPublicUser(updated as PrismaUserRecord);
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          // Race condition: uniqueness check passed, but another request won the race
          const target = (err.meta?.target as string[]) ?? [];
          const field = target.includes('username') ? 'Username' : 'Email address';
          throw new GraphQLError(`${field} already exists!`, {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        throw err;
      }
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

      try {
        const updated = await context.prisma.user.update({
          where: { id: targetId },
          data: { avatar: args.avatarQualities as Prisma.InputJsonValue },
        });
        return toPublicUser(updated as PrismaUserRecord);
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        throw err;
      }
    },
  },
};
