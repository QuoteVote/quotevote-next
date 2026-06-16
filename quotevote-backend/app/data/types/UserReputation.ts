import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  type GraphQLFieldConfigMap,
} from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';

export const ReputationMetricsType: GraphQLObjectType<Common.ReputationMetrics, GraphQLContext> =
  new GraphQLObjectType<Common.ReputationMetrics, GraphQLContext>({
    name: 'ReputationMetrics',
    fields: (): GraphQLFieldConfigMap<Common.ReputationMetrics, GraphQLContext> => ({
      totalInvitesSent: { type: new GraphQLNonNull(GraphQLInt) },
      totalInvitesAccepted: { type: new GraphQLNonNull(GraphQLInt) },
      totalInvitesDeclined: { type: new GraphQLNonNull(GraphQLInt) },
      averageInviteeReputation: { type: new GraphQLNonNull(GraphQLInt) },
      totalReportsReceived: { type: new GraphQLNonNull(GraphQLInt) },
      totalReportsResolved: { type: new GraphQLNonNull(GraphQLInt) },
      totalUpvotes: { type: new GraphQLNonNull(GraphQLInt) },
      totalDownvotes: { type: new GraphQLNonNull(GraphQLInt) },
      totalPosts: { type: new GraphQLNonNull(GraphQLInt) },
      totalComments: { type: new GraphQLNonNull(GraphQLInt) },
    }),
  });

interface ReputationHistoryEntry {
  date: string;
  overallScore: number;
  inviteNetworkScore: number;
  conductScore: number;
  activityScore: number;
  reason: string;
}

export const ReputationHistoryType: GraphQLObjectType<ReputationHistoryEntry, GraphQLContext> =
  new GraphQLObjectType<ReputationHistoryEntry, GraphQLContext>({
    name: 'ReputationHistory',
    fields: (): GraphQLFieldConfigMap<ReputationHistoryEntry, GraphQLContext> => ({
      date: { type: new GraphQLNonNull(GraphQLString) },
      overallScore: { type: new GraphQLNonNull(GraphQLInt) },
      inviteNetworkScore: { type: new GraphQLNonNull(GraphQLInt) },
      conductScore: { type: new GraphQLNonNull(GraphQLInt) },
      activityScore: { type: new GraphQLNonNull(GraphQLInt) },
      reason: { type: new GraphQLNonNull(GraphQLString) },
    }),
  });

export const UserReputationType: GraphQLObjectType<Common.Reputation, GraphQLContext> =
  new GraphQLObjectType<Common.Reputation, GraphQLContext>({
    name: 'UserReputation',
    description: 'Aggregated reputation score for a user across invite/conduct/activity axes.',
    fields: (): GraphQLFieldConfigMap<Common.Reputation, GraphQLContext> => ({
      _id: { type: new GraphQLNonNull(GraphQLString) },
      _userId: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: (rep) => rep.userId ?? '',
      },
      overallScore: { type: new GraphQLNonNull(GraphQLInt) },
      inviteNetworkScore: { type: new GraphQLNonNull(GraphQLInt) },
      conductScore: { type: new GraphQLNonNull(GraphQLInt) },
      activityScore: { type: new GraphQLNonNull(GraphQLInt) },
      metrics: { type: new GraphQLNonNull(ReputationMetricsType) },
      history: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ReputationHistoryType))),
        resolve: (rep) =>
          (rep as Common.Reputation & { history?: ReputationHistoryEntry[] }).history ?? [],
      },
      lastCalculated: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: (rep) =>
          rep.lastCalculated instanceof Date
            ? rep.lastCalculated.toISOString()
            : String(rep.lastCalculated),
      },
      createdAt: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: (rep) => {
          const v = (rep as Common.Reputation & { createdAt?: Date | string }).createdAt;
          return v instanceof Date ? v.toISOString() : (v ?? '');
        },
      },
      updatedAt: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: (rep) => {
          const v = (rep as Common.Reputation & { updatedAt?: Date | string }).updatedAt;
          return v instanceof Date ? v.toISOString() : (v ?? '');
        },
      },
    }),
  });

export const UserReportType: GraphQLObjectType<Common.UserReport, GraphQLContext> =
  new GraphQLObjectType<Common.UserReport, GraphQLContext>({
    name: 'UserReport',
    fields: (): GraphQLFieldConfigMap<Common.UserReport, GraphQLContext> => ({
      _id: { type: new GraphQLNonNull(GraphQLString) },
      _reporterId: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: (r) => r.reporterId,
      },
      _reportedUserId: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: (r) => r.reportedUserId,
      },
      reason: { type: new GraphQLNonNull(GraphQLString) },
      description: { type: GraphQLString },
      status: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: (r) => r.status ?? 'pending',
      },
      severity: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: (r) => r.severity ?? 'low',
      },
      adminNotes: { type: GraphQLString },
      createdAt: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: (r) => (r.created instanceof Date ? r.created.toISOString() : String(r.created)),
      },
      updatedAt: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: (r) => {
          const v = (r as Common.UserReport & { updatedAt?: Date | string }).updatedAt;
          return v instanceof Date ? v.toISOString() : (v ?? '');
        },
      },
    }),
  });

export const UserReputation = UserReputationType;
