/**
 * Mongoose Types
 * Document interfaces and schema-related types for MongoDB/Mongoose
 */

import type { Document, Model, Types } from 'mongoose'
import type * as Common from '~/types/common'

// ============================================================================
// Base Document Interface
// ============================================================================

/**
 * Base interface for all Mongoose documents
 * Extends native Mongoose Document with common fields
 * Note: createdAt and updatedAt are required as schemas use { timestamps: true }
 */
export interface BaseDocument extends Document {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// User Document Interfaces
// ============================================================================

export interface UserDocument extends BaseDocument, Omit<Common.User, '_id' | 'createdAt' | 'updatedAt'> {
  _id: Types.ObjectId
  password: string
  comparePassword(candidatePassword: string): Promise<boolean>
}

export interface UserModel extends Model<UserDocument> {
  findByUsername(username: string): Promise<UserDocument | null>
  findByEmail(email: string): Promise<UserDocument | null>
}

export interface ReputationDocument extends BaseDocument, Omit<Common.Reputation, '_id' | 'userId'> {
  _id: Types.ObjectId
  userId: Types.ObjectId
}

export interface ReputationModel extends Model<ReputationDocument> {
  findByUserId(userId: string): Promise<ReputationDocument | null>
  calculateScore(userId: string): Promise<ReputationDocument>
}

// ============================================================================
// Post Document Interfaces
// ============================================================================

export interface PostDocument extends BaseDocument, Omit<Common.Post, '_id' | 'userId' | 'groupId' | 'updatedAt'> {
  _id: Types.ObjectId
  userId: Types.ObjectId
  groupId?: Types.ObjectId
}

export interface PostModel extends Model<PostDocument> {
  findByUserId(userId: string): Promise<PostDocument[]>
  findFeatured(limit?: number): Promise<PostDocument[]>
}

// ============================================================================
// Comment Document Interfaces
// ============================================================================

export interface CommentDocument extends BaseDocument, Omit<Common.Comment, '_id' | 'userId' | 'postId' | 'updatedAt'> {
  _id: Types.ObjectId
  userId: Types.ObjectId
  postId: Types.ObjectId
}

export interface CommentModel extends Model<CommentDocument> {
  findByPostId(postId: string): Promise<CommentDocument[]>
  findByUserId(userId: string): Promise<CommentDocument[]>
}

// ============================================================================
// Vote Document Interfaces
// ============================================================================

export interface VoteDocument extends BaseDocument, Omit<Common.Vote, '_id' | 'userId' | 'postId' | 'updatedAt'> {
  _id: Types.ObjectId
  userId: Types.ObjectId
  postId: Types.ObjectId
}

export interface VoteModel extends Model<VoteDocument> {
  findByPostId(postId: string): Promise<VoteDocument[]>
  findByUserId(userId: string): Promise<VoteDocument[]>
}

export interface VoteLogDocument extends BaseDocument, Omit<Common.VoteLog, '_id' | 'userId' | 'postId'> {
  _id: Types.ObjectId
  userId: Types.ObjectId
  postId: Types.ObjectId
}

export type VoteLogModel = Model<VoteLogDocument>

// ============================================================================
// Quote Document Interfaces
// ============================================================================

export interface QuoteDocument extends BaseDocument, Omit<Common.Quote, '_id' | 'userId' | 'postId' | 'updatedAt'> {
  _id: Types.ObjectId
  userId: Types.ObjectId
  postId: Types.ObjectId
}

export interface QuoteModel extends Model<QuoteDocument> {
  findByPostId(postId: string): Promise<QuoteDocument[]>
  findLatest(limit: number): Promise<QuoteDocument[]>
}

// ============================================================================
// Message & Chat Document Interfaces
// ============================================================================

export interface MessageDocument extends BaseDocument, Omit<Common.Message, '_id' | 'userId' | 'messageRoomId' | 'updatedAt'> {
  _id: Types.ObjectId
  userId: Types.ObjectId
  messageRoomId: Types.ObjectId
}

export interface MessageModel extends Model<MessageDocument> {
  findByRoomId(messageRoomId: string): Promise<MessageDocument[]>
}

export interface MessageRoomDocument extends BaseDocument, Omit<Common.MessageRoom, '_id' | 'users' | 'postId' | 'updatedAt'> {
  _id: Types.ObjectId
  users?: Types.ObjectId[]
  postId?: Types.ObjectId
}

export interface MessageRoomModel extends Model<MessageRoomDocument> {
  findByUserId(userId: string): Promise<MessageRoomDocument[]>
  findByPostId(postId: string): Promise<MessageRoomDocument | null>
  findBetweenUsers(userId1: string, userId2: string): Promise<MessageRoomDocument | null>
}

// ============================================================================
// Notification Document Interfaces
// ============================================================================

export interface NotificationDocument extends BaseDocument, Omit<Common.Notification, '_id' | 'userId' | 'userIdBy' | 'postId' | 'updatedAt'> {
  _id: Types.ObjectId
  userId: Types.ObjectId
  userIdBy: Types.ObjectId
  postId?: Types.ObjectId
}

export interface NotificationModel extends Model<NotificationDocument> {
  findByUserId(userId: string): Promise<NotificationDocument[]>
}

// ============================================================================
// Activity Document Interfaces
// ============================================================================

export interface ActivityDocument extends BaseDocument, Omit<Common.Activity, '_id' | 'userId' | 'postId' | 'voteId' | 'commentId' | 'quoteId'> {
  _id: Types.ObjectId
  userId: Types.ObjectId
  postId?: Types.ObjectId
  voteId?: Types.ObjectId
  commentId?: Types.ObjectId
  quoteId?: Types.ObjectId
}

export interface ActivityModel extends Model<ActivityDocument> {
  findByUserId(userId: string, options?: { limit?: number; offset?: number }): Promise<ActivityDocument[]>
}

// ============================================================================
// Group Document Interfaces
// ============================================================================

export interface GroupDocument extends BaseDocument, Omit<Common.Group, '_id' | 'creatorId' | 'adminIds' | 'allowedUserIds' | 'updatedAt'> {
  _id: Types.ObjectId
  creatorId: Types.ObjectId
  adminIds?: Types.ObjectId[]
  allowedUserIds?: Types.ObjectId[]
}

export interface GroupModel extends Model<GroupDocument> {
  findByCreatorId(creatorId: string): Promise<GroupDocument[]>
}

// ============================================================================
// Roster Document Interfaces
// ============================================================================

export interface RosterDocument extends BaseDocument, Omit<Common.Roster, '_id' | 'userId' | 'buddyId' | 'initiatedBy'> {
  _id: Types.ObjectId
  userId: Types.ObjectId
  buddyId: Types.ObjectId
  initiatedBy?: Types.ObjectId
}

export interface RosterModel extends Model<RosterDocument> {
  findByUserId(userId: string): Promise<RosterDocument[]>
  findPendingRequests(userId: string): Promise<RosterDocument[]>
  findBlockedUsers(userId: string): Promise<RosterDocument[]>
}

// ============================================================================
// Presence Document Interfaces
// ============================================================================

export interface PresenceDocument extends BaseDocument, Omit<Common.Presence, '_id' | 'userId'> {
  _id: Types.ObjectId
  userId: Types.ObjectId
}

export interface PresenceModel extends Model<PresenceDocument> {
  findByUserId(userId: string): Promise<PresenceDocument | null>
  updateHeartbeat(userId: string): Promise<PresenceDocument>
}

// ============================================================================
// Typing Document Interfaces
// ============================================================================

export interface TypingDocument extends Document, Omit<Common.Typing, 'messageRoomId' | 'userId'> {
  messageRoomId: Types.ObjectId
  userId: Types.ObjectId
}

export interface TypingModel extends Model<TypingDocument> {
  findByRoomId(messageRoomId: string): Promise<TypingDocument[]>
}

// ============================================================================
// Reaction Document Interfaces
// ============================================================================

export interface ReactionDocument extends BaseDocument, Omit<Common.Reaction, '_id' | 'userId' | 'actionId' | 'messageId'> {
  _id: Types.ObjectId
  userId: Types.ObjectId
  actionId?: Types.ObjectId
  messageId?: Types.ObjectId
}

export interface ReactionModel extends Model<ReactionDocument> {
  findByActionId(actionId: string): Promise<ReactionDocument[]>
  findByMessageId(messageId: string): Promise<ReactionDocument[]>
}

// ============================================================================
// Invite & Report Document Interfaces
// ============================================================================

export interface UserInviteDocument extends BaseDocument, Omit<Common.UserInvite, '_id' | 'invitedBy'> {
  _id: Types.ObjectId
  invitedBy?: Types.ObjectId
}

export interface UserInviteModel extends Model<UserInviteDocument> {
  findByEmail(email: string): Promise<UserInviteDocument | null>
}

export interface UserReportDocument extends BaseDocument, Omit<Common.UserReport, '_id' | 'reportedUserId' | 'reporterId'> {
  _id: Types.ObjectId
  reportedUserId: Types.ObjectId
  reporterId: Types.ObjectId
}

export type UserReportModel = Model<UserReportDocument>

export interface BotReportDocument extends BaseDocument, Omit<Common.BotReport, '_id' | 'userId' | 'reporterId'> {
  _id: Types.ObjectId
  userId: Types.ObjectId
  reporterId: Types.ObjectId
}

export type BotReportModel = Model<BotReportDocument>

// ============================================================================
// Collection Document Interfaces
// ============================================================================

export interface CollectionDocument extends BaseDocument, Omit<Common.Collection, '_id' | 'userId' | 'postIds' | 'updatedAt'> {
  _id: Types.ObjectId
  userId: Types.ObjectId
  postIds?: Types.ObjectId[]
}

export type CollectionModel = Model<CollectionDocument>

// ============================================================================
// Content & Creator Document Interfaces
// ============================================================================

export interface DomainDocument extends BaseDocument, Omit<Common.Domain, '_id'> {
  _id: Types.ObjectId
}

export type DomainModel = Model<DomainDocument>

export interface CreatorDocument extends BaseDocument, Omit<Common.Creator, '_id'> {
  _id: Types.ObjectId
}

export type CreatorModel = Model<CreatorDocument>

export interface ContentDocument extends BaseDocument, Omit<Common.Content, '_id' | 'creatorId' | 'domainId'> {
  _id: Types.ObjectId
  creatorId: Types.ObjectId
  domainId?: Types.ObjectId
}

export type ContentModel = Model<ContentDocument>

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Extract the plain object type from a Mongoose document
 */
export type DocumentToObject<T extends Document> = Omit<
  T,
  keyof Document | 'save' | 'remove' | 'validate'
>

/**
 * Helper to convert ObjectId fields to strings
 */
export type WithStringIds<T> = {
  [K in keyof T]: T[K] extends Types.ObjectId
    ? string
    : T[K] extends Types.ObjectId | undefined
    ? string | undefined
    : T[K] extends Types.ObjectId[]
    ? string[]
    : T[K] extends Types.ObjectId[] | undefined
    ? string[] | undefined
    : T[K]
}

/**
 * Lean document type - document converted to plain object
 */
export type LeanDocument<T extends Document> = WithStringIds<DocumentToObject<T>>

/**
 * Schema options type
 */
export interface SchemaOptions {
  timestamps?: boolean
  collection?: string
  toJSON?: {
    virtuals?: boolean
    transform?: (doc: Document, ret: Record<string, unknown>) => Record<string, unknown>
  }
  toObject?: {
    virtuals?: boolean
    transform?: (doc: Document, ret: Record<string, unknown>) => Record<string, unknown>
  }
}
