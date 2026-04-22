/**
 * GraphQL domain type definitions — TypeScript programmatic form.
 *
 * Each `*Type` is a `GraphQLObjectType<TSource, GraphQLContext>` bound to a
 * shared `~/types/common` interface (which itself tracks the Prisma model shape).
 * This gives compile-time verification that GraphQL fields match the domain type
 * system end-to-end.
 *
 * `domainTypes`       — array of all 25 declared object types + their sub-types.
 * `domainTypeDefs`    — printed SDL string for all domain types (enums, scalars,
 *                       objects), ready to concatenate with any Query/Mutation
 *                       SDL when composing the Apollo schema.
 */

import type { GraphQLNamedType } from 'graphql';
import { printType } from 'graphql';

// Scalars & enums
import { DateScalar, JSONScalar } from './scalars';
import { PresenceStatusEnum, RosterStatusEnum } from './enums';

// Core domain object types — one per legacy typedef file
import { ActivityType } from './Activity';
import { ActivitiesType } from './Activities';
import { PaginationType } from './Pagination';
import { CommentType } from './Comment';
import { ChatRoomType } from './ChatRooms';
import { GroupType } from './Group';
import { MessageType } from './Message';
import { MessageRoomType, PostDetailsType } from './MessageRoom';
import { NotificationType } from './Notification';
import { PostType } from './Post';
import { PostsType } from './Posts';
import { QuoteType } from './Quote';
import { ReactionType } from './Reaction';
import { UserType } from './User';
import { UserInviteType } from './UserInvite';
import {
  ReputationHistoryType,
  ReputationMetricsType,
  UserReportType,
  UserReputationType,
} from './UserReputation';
import { VoteType } from './Vote';
import { DeletedPostType } from './DeletedPost';
import { DeletedQuoteType } from './DeletedQuote';
import { DeletedCommentType } from './DeletedComment';
import { DeletedVoteType } from './DeletedVote';
import { DeletedMessageType } from './DeletedMessage';
import { HeartbeatResponseType, PresenceType, PresenceUpdateType } from './Presence';
import { BuddyWithPresenceType, DeletedRosterType, RosterType } from './Roster';
import { TypingIndicatorType, TypingResponseType } from './TypingIndicator';

export * from './scalars';
export * from './enums';
export * from './Activity';
export * from './Activities';
export * from './Pagination';
export * from './Comment';
export * from './ChatRooms';
export * from './Group';
export * from './Message';
export * from './MessageRoom';
export * from './Notification';
export * from './Post';
export * from './Posts';
export * from './Quote';
export * from './Reaction';
export * from './User';
export * from './UserInvite';
export * from './UserReputation';
export * from './Vote';
export * from './DeletedPost';
export * from './DeletedQuote';
export * from './DeletedComment';
export * from './DeletedVote';
export * from './DeletedMessage';
export * from './Presence';
export * from './Roster';
export * from './TypingIndicator';

/**
 * All programmatic GraphQL types composing the domain schema.
 * Keep this ordering stable — it defines the order types appear in the printed SDL.
 */
export const domainTypes: readonly GraphQLNamedType[] = [
  // Scalars
  DateScalar,
  JSONScalar,
  // Enums
  PresenceStatusEnum,
  RosterStatusEnum,
  // Pagination / envelopes
  PaginationType,
  PostsType,
  ActivitiesType,
  // Core entities
  UserType,
  UserInviteType,
  UserReputationType,
  ReputationMetricsType,
  ReputationHistoryType,
  UserReportType,
  PostType,
  CommentType,
  VoteType,
  QuoteType,
  GroupType,
  NotificationType,
  ActivityType,
  ReactionType,
  // Chat / messaging
  ChatRoomType,
  MessageType,
  MessageRoomType,
  PostDetailsType,
  // Soft-delete payloads
  DeletedPostType,
  DeletedQuoteType,
  DeletedCommentType,
  DeletedVoteType,
  DeletedMessageType,
  // Presence / roster / typing
  PresenceType,
  PresenceUpdateType,
  HeartbeatResponseType,
  RosterType,
  BuddyWithPresenceType,
  DeletedRosterType,
  TypingIndicatorType,
  TypingResponseType,
];

/**
 * Printed SDL for all domain types. Composable with any Query/Mutation SDL.
 *
 * Example:
 *   const typeDefs = `${domainTypeDefs}\n\ntype Query { ... }`;
 */
export const domainTypeDefs: string = domainTypes.map((t) => printType(t)).join('\n\n');
