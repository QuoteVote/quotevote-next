/**
 * GraphQL Types
 * Types for GraphQL context, resolvers, and subscriptions
 */

import type { Request, Response } from 'express';
import type * as Common from '~/types/common';
import type { PubSub } from 'graphql-subscriptions';

export type { PubSub };

// ============================================================================
// GraphQL Context
// ============================================================================

/**
 * GraphQL context available in all resolvers
 * Contains request/response objects, authenticated user, and utilities
 */
export interface GraphQLContext {
  /** Express request object */
  req: Request;
  /** Express response object */
  res: Response;
  /** Currently authenticated user (if any) */
  user?: Common.User | null;
  /** PubSub instance for subscriptions */
  pubsub: PubSub;
  /** Data loaders for batching/caching */
  loaders?: DataLoaders;
  /** Request ID for tracing */
  requestId?: string;
}

// ============================================================================
// Data Loaders
// ============================================================================

/** DataLoader type for batch loading */
export interface DataLoader<K, V> {
  load(key: K): Promise<V>;
  loadMany(keys: K[]): Promise<(V | Error)[]>;
  clear(key: K): this;
  clearAll(): this;
  prime(key: K, value: V): this;
}

export interface DataLoaders {
  userLoader: DataLoader<string, Common.User | null>;
  postLoader: DataLoader<string, Common.Post | null>;
  commentLoader: DataLoader<string, Common.Comment | null>;
  voteLoader: DataLoader<string, Common.Vote | null>;
  quoteLoader: DataLoader<string, Common.Quote | null>;
  messageRoomLoader: DataLoader<string, Common.MessageRoom | null>;
  notificationLoader: DataLoader<string, Common.Notification | null>;
}

// ============================================================================
// Resolver Types
// ============================================================================

/** GraphQL resolve info type */
export interface GraphQLResolveInfo {
  fieldName: string;
  fieldNodes: readonly unknown[];
  returnType: unknown;
  parentType: unknown;
  path: { key: string | number; prev?: unknown };
  schema: unknown;
  fragments: Record<string, unknown>;
  rootValue: unknown;
  operation: unknown;
  variableValues: Record<string, unknown>;
}

/**
 * Base resolver function type
 */
export type ResolverFn<TResult, TParent = unknown, TArgs = Record<string, unknown>> = (
  parent: TParent,
  args: TArgs,
  context: GraphQLContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

/**
 * Resolver map for a specific type
 */
export type TypeResolvers<TSource = unknown> = {
  [field: string]: ResolverFn<unknown, TSource, Record<string, unknown>>;
};

// ============================================================================
// Query Resolvers
// ============================================================================

/**
 * Query resolver types
 * @note When implementing resolvers, ensure return types match these definitions.
 * Use `satisfies QueryResolvers` to verify type compatibility.
 */
export interface QueryResolvers {
  // User queries
  user: ResolverFn<Common.User | null, unknown, { username: string }>;
  users: ResolverFn<Common.User[], unknown, { limit?: number; offset?: number }>;
  searchUser: ResolverFn<Common.User[], unknown, { query: string }>;
  getUserFollowInfo: ResolverFn<Common.User[], unknown, { username: string; filter: string }>;
  checkDuplicateEmail: ResolverFn<boolean, unknown, { email: string }>;

  // Post queries
  post: ResolverFn<Common.Post | null, unknown, { postId: string }>;
  posts: ResolverFn<Common.PaginatedResult<Common.Post>, unknown, PostQueryArgs>;
  featuredPosts: ResolverFn<Common.PaginatedResult<Common.Post>, unknown, PostQueryArgs>;

  // Quote queries
  latestQuotes: ResolverFn<Common.Quote[], unknown, { limit: number }>;

  // Group queries
  group: ResolverFn<Common.Group | null, unknown, { groupId: string }>;
  groups: ResolverFn<Common.Group[], unknown, { limit: number }>;

  // Activity queries
  activities: ResolverFn<Common.PaginatedResult<Common.Activity>, unknown, ActivityQueryArgs>;

  // Notification queries
  notifications: ResolverFn<Common.Notification[]>;

  // Message queries
  messages: ResolverFn<Common.Message[], unknown, { messageRoomId: string }>;
  messageRoom: ResolverFn<Common.MessageRoom | null, unknown, { otherUserId: string }>;
  messageRooms: ResolverFn<Common.MessageRoom[]>;
  messageReactions: ResolverFn<Common.Reaction[], unknown, { messageId: string }>;

  // Roster (buddy) queries
  buddyList: ResolverFn<Common.Roster[]>;
  roster: ResolverFn<RosterQueryResult>;

  // Action reactions
  actionReactions: ResolverFn<Common.Reaction[], unknown, { actionId: string }>;

  // Search queries
  searchContent: ResolverFn<Common.Content[], unknown, { text: string }>;
  searchCreator: ResolverFn<Common.Creator[], unknown, { text: string }>;

  // Admin queries
  getBotReportedUsers: ResolverFn<Common.User[], unknown, { sortBy?: string; limit?: number }>;

  // Token verification
  verifyUserPasswordResetToken: ResolverFn<boolean, unknown, { token: string }>;
}

// ============================================================================
// Mutation Resolvers
// ============================================================================

/**
 * Mutation resolver types
 * @note When implementing resolvers, ensure return types match these definitions.
 * Use `satisfies MutationResolvers` to verify type compatibility.
 */
export interface MutationResolvers {
  // User mutations
  followUser: ResolverFn<Common.User, unknown, { user_id: string; action: string }>;
  updateUserPassword: ResolverFn<
    boolean,
    unknown,
    { username: string; password: string; token: string }
  >;
  disableUser: ResolverFn<Common.User, unknown, { userId: string }>;
  enableUser: ResolverFn<Common.User, unknown, { userId: string }>;

  // Post mutations
  addPost: ResolverFn<Common.Post, unknown, { post: Common.PostInput }>;
  deletePost: ResolverFn<Common.Post, unknown, { postId: string }>;
  approvePost: ResolverFn<
    Common.Post,
    unknown,
    { postId: string; userId: string; remove?: boolean }
  >;
  rejectPost: ResolverFn<
    Common.Post,
    unknown,
    { postId: string; userId: string; remove?: boolean }
  >;
  reportPost: ResolverFn<Common.Post, unknown, { postId: string; userId: string }>;
  updatePostBookmark: ResolverFn<Common.Post, unknown, { postId: string; userId: string }>;
  toggleVoting: ResolverFn<Common.Post, unknown, { postId: string }>;
  updateFeaturedSlot: ResolverFn<Common.Post, unknown, { postId: string; featuredSlot?: number }>;

  // Comment mutations
  addComment: ResolverFn<Common.Comment, unknown, { comment: Common.CommentInput }>;
  updateComment: ResolverFn<Common.Comment, unknown, { commentId: string; content: string }>;
  deleteComment: ResolverFn<Common.Comment, unknown, { commentId: string }>;

  // Vote mutations
  addVote: ResolverFn<Common.Vote, unknown, { vote: Common.VoteInput }>;
  deleteVote: ResolverFn<Common.Vote, unknown, { voteId: string }>;

  // Quote mutations
  addQuote: ResolverFn<Common.Quote, unknown, { quote: Common.QuoteInput }>;
  deleteQuote: ResolverFn<Common.Quote, unknown, { quoteId: string }>;

  // Message mutations
  createMessage: ResolverFn<Common.Message, unknown, { message: Common.MessageInput }>;
  deleteMessage: ResolverFn<Common.Message, unknown, { messageId: string }>;
  createPostMessageRoom: ResolverFn<Common.MessageRoom, unknown, { postId: string }>;

  // Reaction mutations
  addActionReaction: ResolverFn<Common.Reaction, unknown, { reaction: Common.ReactionInput }>;
  updateActionReaction: ResolverFn<Common.Reaction, unknown, { _id: string; emoji: string }>;
  addMessageReaction: ResolverFn<Common.Reaction, unknown, { reaction: Common.ReactionInput }>;
  updateReaction: ResolverFn<Common.Reaction, unknown, { _id: string; emoji: string }>;

  // Group mutations
  createGroup: ResolverFn<Common.Group, unknown, { group: Common.GroupInput }>;

  // Roster mutations
  addBuddy: ResolverFn<Common.Roster, unknown, { roster: Common.RosterInput }>;
  acceptBuddy: ResolverFn<Common.Roster, unknown, { rosterId: string }>;
  declineBuddy: ResolverFn<Common.Roster, unknown, { rosterId: string }>;
  blockBuddy: ResolverFn<Common.Roster, unknown, { buddyId: string }>;
  unblockBuddy: ResolverFn<Common.Roster, unknown, { buddyId: string }>;
  removeBuddy: ResolverFn<MutationResult, unknown, { buddyId: string }>;

  // Presence mutations
  heartbeat: ResolverFn<HeartbeatResult>;
  updatePresence: ResolverFn<Common.Presence, unknown, { presence: Common.PresenceInput }>;

  // Typing mutations
  updateTyping: ResolverFn<TypingResult, unknown, { typing: Common.TypingInput }>;

  // Notification mutations
  removeNotification: ResolverFn<Common.Notification, unknown, { notificationId: string }>;

  // Invite & Report mutations
  sendUserInvite: ResolverFn<MutationResult, unknown, { email: string }>;
  requestUserAccess: ResolverFn<
    Common.UserInvite,
    unknown,
    { requestUserAccessInput: Common.RequestUserAccessInput }
  >;
  reportUser: ResolverFn<MutationResult, unknown, { reportUserInput: Common.ReportUserInput }>;
  reportBot: ResolverFn<boolean, unknown, { userId: string; reporterId: string }>;

  // Email mutations
  sendPasswordResetEmail: ResolverFn<boolean, unknown, { email: string }>;
  sendInvestorMail: ResolverFn<boolean, unknown, { email: string }>;
}

// ============================================================================
// Subscription Resolvers
// ============================================================================

/**
 * Subscription resolver types
 * @note When implementing resolvers, ensure payload types match these definitions.
 */
export interface SubscriptionResolvers {
  presence: SubscriptionResolver<Common.Presence, { userId?: string }>;
  notification: SubscriptionResolver<Common.Notification, { userId: string }>;
  message: SubscriptionResolver<Common.Message, { messageRoomId: string }>;
  typing: SubscriptionResolver<TypingPayload, { messageRoomId: string }>;
  roster: SubscriptionResolver<RosterPayload, { userId: string }>;
}

/**
 * Generic subscription resolver type
 */
export type SubscriptionResolver<TPayload, TArgs = Record<string, unknown>> = {
  subscribe: ResolverFn<AsyncIterator<TPayload>, unknown, TArgs>;
  resolve?: (payload: TPayload) => TPayload;
};

// ============================================================================
// Field Resolvers
// ============================================================================

export interface PostResolvers extends TypeResolvers<Common.Post> {
  creator: ResolverFn<Common.User | null, Common.Post>;
  comments: ResolverFn<Common.Comment[], Common.Post>;
  votes: ResolverFn<Common.Vote[], Common.Post>;
  quotes: ResolverFn<Common.Quote[], Common.Post>;
  messageRoom: ResolverFn<Common.MessageRoom | null, Common.Post>;
}

export interface CommentResolvers extends TypeResolvers<Common.Comment> {
  user: ResolverFn<Common.User | null, Common.Comment>;
}

export interface VoteResolvers extends TypeResolvers<Common.Vote> {
  user: ResolverFn<Common.User | null, Common.Vote>;
}

export interface QuoteResolvers extends TypeResolvers<Common.Quote> {
  user: ResolverFn<Common.User | null, Common.Quote>;
}

export interface MessageResolvers extends TypeResolvers<Common.Message> {
  user: ResolverFn<Common.User | null, Common.Message>;
}

export interface NotificationResolvers extends TypeResolvers<Common.Notification> {
  userBy: ResolverFn<Common.User | null, Common.Notification>;
  post: ResolverFn<Common.Post | null, Common.Notification>;
}

export interface ActivityResolvers extends TypeResolvers<Common.Activity> {
  user: ResolverFn<Common.User | null, Common.Activity>;
  post: ResolverFn<Common.Post | null, Common.Activity>;
  vote: ResolverFn<Common.Vote | null, Common.Activity>;
  comment: ResolverFn<Common.Comment | null, Common.Activity>;
  quote: ResolverFn<Common.Quote | null, Common.Activity>;
}

export interface RosterResolvers extends TypeResolvers<Common.Roster> {
  buddy: ResolverFn<Common.User | null, Common.Roster>;
}

export interface UserResolvers extends TypeResolvers<Common.User> {
  reputation: ResolverFn<Common.Reputation | null, Common.User>;
}

// ============================================================================
// Complete Resolver Map
// ============================================================================

export interface Resolvers {
  Query: QueryResolvers;
  Mutation: MutationResolvers;
  Subscription: SubscriptionResolvers;
  Post: PostResolvers;
  Comment: CommentResolvers;
  Vote: VoteResolvers;
  Quote: QuoteResolvers;
  Message: MessageResolvers;
  Notification: NotificationResolvers;
  Activity: ActivityResolvers;
  Roster: RosterResolvers;
  User: UserResolvers;
}

// ============================================================================
// Query/Mutation Arguments
// ============================================================================

export interface PostQueryArgs {
  limit?: number;
  offset?: number;
  searchKey?: string;
  startDateRange?: string;
  endDateRange?: string;
  friendsOnly?: boolean;
  interactions?: boolean;
  userId?: string;
  sortOrder?: string;
  groupId?: string;
  approved?: boolean;
  deleted?: boolean;
}

export interface ActivityQueryArgs {
  user_id: string;
  limit: number;
  offset: number;
  searchKey?: string;
  startDateRange?: string;
  endDateRange?: string;
  activityEvent: Common.ActivityEventType[];
}

// ============================================================================
// Subscription Payloads
// ============================================================================

export interface TypingPayload {
  messageRoomId: string;
  userId: string;
  user?: Common.User;
  isTyping: boolean;
  timestamp: number;
}

export interface RosterPayload {
  _id: string;
  userId: string;
  buddyId: string;
  status: Common.RosterStatus;
  initiatedBy?: string;
  created: Date | string;
  updated?: Date | string;
  buddy?: Common.User;
}

// ============================================================================
// Mutation Results
// ============================================================================

export interface MutationResult {
  success?: boolean;
  code?: string;
  message?: string;
}

export interface HeartbeatResult {
  success: boolean;
  timestamp: number;
}

export interface TypingResult {
  success: boolean;
  messageRoomId: string;
  isTyping: boolean;
}

export interface RosterQueryResult {
  buddies: Common.Roster[];
  pendingRequests: Common.Roster[];
  blockedUsers: Common.User[];
}

// ============================================================================
// Subscription Events/Channels
// ============================================================================

export const SUBSCRIPTION_EVENTS = {
  PRESENCE_UPDATED: 'PRESENCE_UPDATED',
  NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
  MESSAGE_CREATED: 'MESSAGE_CREATED',
  MESSAGE_UPDATED: 'MESSAGE_UPDATED',
  MESSAGE_DELETED: 'MESSAGE_DELETED',
  TYPING_UPDATED: 'TYPING_UPDATED',
  ROSTER_UPDATED: 'ROSTER_UPDATED',
  POST_CREATED: 'POST_CREATED',
  POST_UPDATED: 'POST_UPDATED',
  POST_DELETED: 'POST_DELETED',
} as const;

export type SubscriptionEvent = (typeof SUBSCRIPTION_EVENTS)[keyof typeof SUBSCRIPTION_EVENTS];
