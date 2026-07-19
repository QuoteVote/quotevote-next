/**
 * Shared GraphQL enum types used by the domain schema.
 * Values mirror the constants in `app/data/utils/constants.ts` and Prisma.
 */

import { GraphQLEnumType } from 'graphql';
import {
  AccountStatusValues,
  VoteTypeValues,
  RosterStatusValues,
  MessageTypeValues,
  NotificationTypeValues,
  ActivityEventTypeValues,
  GroupPrivacyValues,
  InviteStatusValues,
  ReportStatusValues,
  ReportSeverityValues,
  ReportReasonValues,
  PresenceStatusValues,
} from '../utils/constants';

// Helper to convert constant values to GraphQLEnumValueConfigMap
function toEnumValues<T extends Record<string, string>>(values: T) {
  const result: Record<string, { value: string }> = {};
  for (const k of Object.keys(values)) {
    const val = values[k];
    result[val] = { value: val };
  }
  return result;
}

export const PresenceStatusEnum = new GraphQLEnumType({
  name: 'PresenceStatus',
  values: toEnumValues(PresenceStatusValues),
});

export const RosterStatusEnum = new GraphQLEnumType({
  name: 'RosterStatus',
  values: toEnumValues(RosterStatusValues),
});

export const AccountStatusEnum = new GraphQLEnumType({
  name: 'AccountStatus',
  values: toEnumValues(AccountStatusValues),
});

export const VoteTypeEnum = new GraphQLEnumType({
  name: 'VoteType',
  values: toEnumValues(VoteTypeValues),
});

export const MessageTypeEnum = new GraphQLEnumType({
  name: 'MessageType',
  values: toEnumValues(MessageTypeValues),
});

export const NotificationTypeEnum = new GraphQLEnumType({
  name: 'NotificationType',
  values: toEnumValues(NotificationTypeValues),
});

export const ActivityEventTypeEnum = new GraphQLEnumType({
  name: 'ActivityEventType',
  values: toEnumValues(ActivityEventTypeValues),
});

export const GroupPrivacyEnum = new GraphQLEnumType({
  name: 'GroupPrivacy',
  values: toEnumValues(GroupPrivacyValues),
});

export const InviteStatusEnum = new GraphQLEnumType({
  name: 'InviteStatus',
  values: toEnumValues(InviteStatusValues),
});

export const ReportStatusEnum = new GraphQLEnumType({
  name: 'ReportStatus',
  values: toEnumValues(ReportStatusValues),
});

export const ReportSeverityEnum = new GraphQLEnumType({
  name: 'ReportSeverity',
  values: toEnumValues(ReportSeverityValues),
});

export const ReportReasonEnum = new GraphQLEnumType({
  name: 'ReportReason',
  values: toEnumValues(ReportReasonValues),
});
