import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  type GraphQLFieldConfigMap,
} from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { JSONScalar } from './scalars';
import { UserReputationType } from './UserReputation';

export const UserType: GraphQLObjectType<Common.User, GraphQLContext> = new GraphQLObjectType<
  Common.User,
  GraphQLContext
>({
  name: 'User',
  description: 'Registered user account, aligned with Prisma User / Mongoose User model.',
  fields: (): GraphQLFieldConfigMap<Common.User, GraphQLContext> => ({
    _id: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: GraphQLID, resolve: (u) => u._id },
    joined: {
      type: GraphQLString,
      resolve: (u) => (u.joined instanceof Date ? u.joined.toISOString() : u.joined),
    },
    username: { type: GraphQLString },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    tokens: { type: GraphQLInt },
    _wallet: { type: GraphQLString, resolve: (u) => u._wallet },
    avatar: { type: JSONScalar },
    _followersId: {
      type: new GraphQLList(GraphQLString),
      resolve: (u) => u._followersId ?? [],
    },
    _followingId: {
      type: new GraphQLList(GraphQLString),
      resolve: (u) => u._followingId ?? [],
    },
    _votesId: {
      type: GraphQLInt,
      resolve: (u) => {
        const raw = u._votesId;
        if (raw == null) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
      },
    },
    favorited: {
      type: GraphQLInt,
      resolve: (u) => (Array.isArray(u.favorited) ? u.favorited.length : 0),
    },
    admin: { type: GraphQLBoolean },
    upvotes: { type: GraphQLInt },
    downvotes: { type: GraphQLInt },
    contributorBadge: { type: GraphQLBoolean },
    reputation: { type: UserReputationType },
    botReports: { type: GraphQLInt },
    accountStatus: { type: GraphQLString },
    lastBotReportDate: {
      type: GraphQLString,
      resolve: (u) =>
        u.lastBotReportDate instanceof Date
          ? u.lastBotReportDate.toISOString()
          : (u.lastBotReportDate ?? null),
    },
    themePreference: {
      type: GraphQLString,
      resolve: (u) => (u as Common.User & { themePreference?: string }).themePreference ?? null,
    },
  }),
});

export const User = UserType;
