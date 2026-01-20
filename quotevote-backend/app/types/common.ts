/**
 * Core Domain Types
 * Base TypeScript types for the backend domain entities
 * These types represent the core business objects without Mongoose-specific features
 */

// ============================================================================
// Enums and Constants
// ============================================================================

export type ActivityEventType =
  | 'POSTED'
  | 'VOTED'
  | 'COMMENTED'
  | 'QUOTED'
  | 'LIKED'
  | 'UPVOTED'
  | 'DOWNVOTED';

export type PresenceStatus = 'online' | 'away' | 'dnd' | 'offline' | 'invisible';

export type NotificationType = 'FOLLOW' | 'UPVOTED' | 'DOWNVOTED' | 'COMMENTED' | 'QUOTED';

export type VoteType = 'up' | 'down';

export type MessageType = 'USER' | 'POST';

export type RosterStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export type AccountStatus = 'active' | 'disabled';

export type VoteOption = '#true' | '#agree' | '#like' | '#false' | '#disagree' | '#dislike';

export type GroupPrivacy = 'public' | 'private' | 'restricted';

// ============================================================================
// User Types
// ============================================================================

export interface ReputationMetrics {
  totalInvitesSent: number;
  totalInvitesAccepted: number;
  totalInvitesDeclined: number;
  averageInviteeReputation: number;
  totalReportsReceived: number;
  totalReportsResolved: number;
  totalUpvotes: number;
  totalDownvotes: number;
  totalPosts: number;
  totalComments: number;
}

export interface Reputation {
  _id: string;
  userId?: string;
  overallScore: number;
  inviteNetworkScore: number;
  conductScore: number;
  activityScore: number;
  metrics: ReputationMetrics;
  lastCalculated: Date | string;
}

export interface User {
  _id: string;
  name?: string;
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  contributorBadge?: boolean;
  admin?: boolean;
  _followingId?: string[];
  _followersId?: string[];
  upvotes?: number;
  downvotes?: number;
  accountStatus?: AccountStatus;
  botReports?: number;
  lastBotReportDate?: Date | string;
  joined?: Date | string;
  reputation?: Reputation;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// ============================================================================
// Post Types
// ============================================================================

export interface Post {
  _id: string;
  userId: string;
  groupId?: string;
  title?: string;
  text?: string;
  url?: string;
  citationUrl?: string;
  upvotes?: number;
  downvotes?: number;
  approvedBy?: string[];
  rejectedBy?: string[];
  reportedBy?: string[];
  bookmarkedBy?: string[];
  enable_voting?: boolean;
  featuredSlot?: number;
  deleted?: boolean;
  created: Date | string;
  updatedAt?: Date | string;
}

// ============================================================================
// Comment Types
// ============================================================================

export interface Comment {
  _id: string;
  userId: string;
  postId: string;
  content: string;
  startWordIndex?: number;
  endWordIndex?: number;
  url?: string;
  reaction?: string;
  created: Date | string;
  updatedAt?: Date | string;
}

// ============================================================================
// Vote Types
// ============================================================================

export interface Vote {
  _id: string;
  userId: string;
  postId: string;
  type: VoteType;
  startWordIndex?: number;
  endWordIndex?: number;
  tags?: string[];
  content?: string;
  created: Date | string;
  updatedAt?: Date | string;
}

export interface VoteLog {
  _id: string;
  postId: string;
  userId: string;
  type: VoteType;
  created: Date | string;
}

// ============================================================================
// Quote Types
// ============================================================================

export interface Quote {
  _id: string;
  userId: string;
  postId: string;
  quote: string;
  startWordIndex?: number;
  endWordIndex?: number;
  created: Date | string;
  updatedAt?: Date | string;
}

// ============================================================================
// Message & Chat Types
// ============================================================================

export interface Message {
  _id: string;
  messageRoomId: string;
  userId: string;
  userName?: string;
  title?: string;
  text?: string;
  type?: string;
  mutation_type?: string;
  created: Date | string;
  updatedAt?: Date | string;
}

export interface MessageRoom {
  _id: string;
  users?: string[];
  postId?: string;
  messageType?: MessageType;
  title?: string;
  avatar?: string;
  lastMessageTime?: Date | string;
  lastActivity?: Date | string;
  unreadMessages?: number;
  created: Date | string;
  updatedAt?: Date | string;
}

/** @deprecated Use Message instead. Alias for backwards compatibility. */
export type Messages = Message;

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  _id: string;
  userId: string;
  userIdBy: string;
  label: string;
  status: string;
  notificationType: NotificationType;
  postId?: string;
  created: Date | string;
  updatedAt?: Date | string;
}

// ============================================================================
// Activity Types
// ============================================================================

export interface Activity {
  _id: string;
  userId: string;
  postId?: string;
  activityType: ActivityEventType;
  content?: string;
  voteId?: string;
  commentId?: string;
  quoteId?: string;
  created: Date | string;
}

// ============================================================================
// Group Types
// ============================================================================

export interface Group {
  _id: string;
  creatorId: string;
  adminIds?: string[];
  allowedUserIds?: string[];
  privacy: GroupPrivacy;
  title: string;
  url?: string;
  description?: string;
  created: Date | string;
  updatedAt?: Date | string;
}

// ============================================================================
// Roster (Buddy) Types
// ============================================================================

export interface Roster {
  _id: string;
  userId: string;
  buddyId: string;
  status: RosterStatus;
  initiatedBy?: string;
  created: Date | string;
  updated?: Date | string;
}

// ============================================================================
// Presence Types
// ============================================================================

export interface Presence {
  _id: string;
  userId: string;
  status: PresenceStatus;
  statusMessage?: string;
  lastHeartbeat?: Date | string | number;
  lastSeen?: Date | string | number;
}

// ============================================================================
// Typing Indicator Types
// ============================================================================

export interface Typing {
  messageRoomId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date | string | number;
}

// ============================================================================
// Reaction Types
// ============================================================================

export interface Reaction {
  _id: string;
  userId: string;
  actionId?: string;
  messageId?: string;
  emoji: string;
  created?: Date | string;
}

// ============================================================================
// Invite & Report Types
// ============================================================================

export interface UserInvite {
  _id: string;
  email: string;
  invitedBy?: string;
  code?: string;
  status?: string;
  created: Date | string;
  expiresAt?: Date | string;
}

export interface UserReport {
  _id: string;
  reportedUserId: string;
  reporterId: string;
  reason: string;
  status?: string;
  created: Date | string;
}

export interface BotReport {
  _id: string;
  userId: string;
  reporterId: string;
  created: Date | string;
}

// ============================================================================
// Collection Types
// ============================================================================

export interface Collection {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  postIds?: string[];
  created: Date | string;
  updatedAt?: Date | string;
}

// ============================================================================
// Content & Creator Types
// ============================================================================

export interface Domain {
  _id: string;
  key: string;
  name?: string;
  created?: Date | string;
}

export interface Creator {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  created?: Date | string;
}

export interface Content {
  _id: string;
  title: string;
  creatorId: string;
  domainId?: string;
  url?: string;
  created: Date | string;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface Pagination {
  total_count: number;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  entities: T[];
  pagination: Pagination;
}

// ============================================================================
// Input Types (for mutations/resolvers)
// ============================================================================

export interface PostInput {
  userId: string;
  groupId?: string;
  title?: string;
  text?: string;
  url?: string;
  citationUrl?: string;
  enable_voting?: boolean;
}

export interface CommentInput {
  userId: string;
  postId: string;
  content: string;
  startWordIndex?: number;
  endWordIndex?: number;
  url?: string;
  reaction?: string;
}

export interface VoteInput {
  userId: string;
  postId: string;
  type: VoteType;
  startWordIndex?: number;
  endWordIndex?: number;
  tags?: string[];
  content?: string;
}

export interface QuoteInput {
  userId: string;
  postId: string;
  quote: string;
  startWordIndex?: number;
  endWordIndex?: number;
}

export interface MessageInput {
  messageRoomId?: string;
  userId: string;
  userName?: string;
  title?: string;
  text?: string;
  type?: string;
  postId?: string;
}

export interface ReactionInput {
  userId: string;
  actionId?: string;
  messageId?: string;
  emoji: string;
}

export interface GroupInput {
  creatorId: string;
  adminIds?: string[];
  allowedUserIds?: string[];
  privacy: GroupPrivacy;
  title: string;
  url?: string;
  description?: string;
}

export interface RosterInput {
  userId: string;
  buddyId: string;
  status?: RosterStatus;
}

export interface PresenceInput {
  userId: string;
  status: PresenceStatus;
  statusMessage?: string;
}

export interface TypingInput {
  messageRoomId: string;
  userId: string;
  isTyping: boolean;
}

export interface ReportUserInput {
  reportedUserId: string;
  reporterId: string;
  reason: string;
}

export interface RequestUserAccessInput {
  email: string;
  name?: string;
  message?: string;
}
