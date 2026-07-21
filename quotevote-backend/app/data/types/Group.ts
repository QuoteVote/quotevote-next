import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  type GraphQLFieldConfigMap,
} from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { UserType } from './User';
import { RosterType } from './Roster';
import { GroupPrivacyEnum } from './enums';

import User from '../models/User';
import Roster from '../models/Roster';

interface GroupShape extends Common.Group {
  pendingUsers?: Common.User[];
}

export const GroupType: GraphQLObjectType<GroupShape, GraphQLContext> = new GraphQLObjectType<
  GroupShape,
  GraphQLContext
>({
  name: 'Group',
  description: 'Group / community, aligned with Prisma Group.',
  fields: (): GraphQLFieldConfigMap<GroupShape, GraphQLContext> => ({
    _id: { type: new GraphQLNonNull(GraphQLString) },
    creatorId: { type: new GraphQLNonNull(GraphQLString) },
    created: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (g) => (g.created instanceof Date ? g.created.toISOString() : String(g.created)),
    },
    title: { type: new GraphQLNonNull(GraphQLString) },
    description: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (g) => g.description ?? '',
    },
    url: { type: new GraphQLNonNull(GraphQLString), resolve: (g) => g.url ?? '' },
    privacy: { type: new GraphQLNonNull(GroupPrivacyEnum) },
    allowedUserIds: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      resolve: (g) => g.allowedUserIds ?? [],
    },
    adminIds: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      resolve: (g) => g.adminIds ?? [],
    },
    pendingUsers: {
      type: new GraphQLList(UserType),
      resolve: (g) => g.pendingUsers ?? [],
    },
    creator: {
      type: UserType,
      resolve: (group) => User.findById(group.creatorId).lean(),
    },
    adminUsers: {
      type: new GraphQLList(UserType),
      resolve: (group) => User.find({ _id: { $in: group.adminIds ?? [] } }).lean(),
    },
    allowedUsers: {
      type: new GraphQLList(UserType),
      resolve: (group) => User.find({ _id: { $in: group.allowedUserIds ?? [] } }).lean(),
    },
    rosters: {
      type: new GraphQLList(RosterType),
      resolve: (group) => {
        const memberIds = [
          group.creatorId,
          ...(group.allowedUserIds ?? []),
        ];
        return Roster.find({
          $or: [
            { userId: { $in: memberIds } },
            { buddyId: { $in: memberIds } },
          ],
        }).lean();
      },
    },
  }),
});

export const Group = GroupType;
