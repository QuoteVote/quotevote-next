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
import { AccountStatusEnum } from './enums';
import { PostType } from './Post';
import { CommentType } from './Comment';
import { VoteType } from './Vote';
import { PresenceType } from './Presence';
import { RosterType } from './Roster';
import { GroupType } from './Group';

import Post from '../models/Post';
import Comment from '../models/Comment';
import Vote from '../models/Vote';
import Presence from '../models/Presence';
import Roster from '../models/Roster';
import Group from '../models/Group';

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
    bio: { type: GraphQLString },
    _followersId: {
      type: new GraphQLList(GraphQLString),
      resolve: (u) => u._followersId ?? [],
    },
    _followingId: {
      type: new GraphQLList(GraphQLString),
      resolve: (u) => u._followingId ?? [],
    },
    _votesId: {
      type: GraphQLString,
      resolve: (u) => u._votesId ?? null,
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
    accountStatus: { type: AccountStatusEnum },
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
    posts: {
      type: new GraphQLList(PostType),
      resolve: (user) => Post.find({ userId: user._id }).lean(),
    },
    comments: {
      type: new GraphQLList(CommentType),
      resolve: (user) => Comment.find({ userId: user._id }).lean(),
    },
    votes: {
      type: new GraphQLList(VoteType),
      resolve: (user) => Vote.find({ userId: user._id }).lean(),
    },
    presence: {
      type: PresenceType,
      resolve: async (user) => {
        const doc = await Presence.findOne({ userId: user._id }).lean();
        if (!doc) return null;
        return {
          ...doc,
          _id: doc._id.toString(),
          userId: doc.userId.toString(),
        };
      },
    },
    rosters: {
      type: new GraphQLList(RosterType),
      resolve: (user) => Roster.find({ userId: user._id }).lean(),
    },
    createdGroups: {
      type: new GraphQLList(GroupType),
      resolve: (user) => Group.find({ creatorId: user._id }).lean(),
    },
    memberOfGroups: {
      type: new GraphQLList(GroupType),
      resolve: (user) => Group.find({ allowedUserIds: user._id }).lean(),
    },
  }),
});

export const User = UserType;
