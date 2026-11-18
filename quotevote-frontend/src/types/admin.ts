/**
 * Admin-related TypeScript type definitions
 */

export interface BotReportedUser {
  _id: string
  name?: string
  username: string
  email: string
  botReports: number
  accountStatus: 'active' | 'disabled'
  lastBotReportDate?: string | Date
  joined?: string | Date
  avatar?: string | Record<string, unknown>
  contributorBadge?: boolean
}

export interface GetBotReportedUsersResponse {
  getBotReportedUsers: BotReportedUser[]
}

export interface GetBotReportedUsersVariables {
  sortBy?: 'botReports' | 'lastReportDate'
  limit?: number
}

export interface DisableUserResponse {
  disableUser: {
    _id: string
    accountStatus: 'active' | 'disabled'
  }
}

export interface DisableUserVariables {
  userId: string
}

export interface EnableUserResponse {
  enableUser: {
    _id: string
    accountStatus: 'active' | 'disabled'
  }
}

export interface EnableUserVariables {
  userId: string
}

export type SortByOption = 'botReports' | 'lastReportDate'

// Invite request types
export interface InviteRequest {
  _id: string
  email: string
  joined: string
  /** "1" pending, "2" declined, "4" accepted. */
  status: string
  /** Accepted requests only: whether signup is done. */
  signedUp?: boolean | null
}

export interface UserInviteRequestsResponse {
  userInviteRequests: InviteRequest[]
}

/** An invite a member emailed from the app. */
export interface SentInvite {
  _id: string
  email: string
  /** pending, accepted, declined or expired */
  status: string | null
  joined: string | null
  expiresAt: string | null
}

export interface SentInvitesResponse {
  getUserInvites: SentInvite[]
}

/** How an invite or request shows in the tables. */
export type InviteDisplayStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'unknown'

/** The actions a request row offers. */
export type InviteRequestAction = 'accept' | 'decline' | 'resend' | 'reset'

export interface InviteStatusTagProps {
  status: InviteDisplayStatus
}

export interface InviteRequestActionsProps {
  invite: InviteRequest
  onComplete: () => Promise<void>
}

export interface InviteDeclineConfirmProps {
  email: string
  disabled: boolean
  onConfirm: () => void
}

export interface InviteEmptyStateProps {
  title: string
  text: string
}

export interface InviteCounts {
  pending: number
  accepted: number
  declined: number
}

export interface UpdateUserInviteStatusResponse {
  updateUserInviteStatus: {
    _id: string
    status: string
  }
}

// User management types
export interface AdminUser {
  _id: string
  name?: string
  username: string
  contributorBadge?: boolean
}

export interface GetUsersResponse {
  users: AdminUser[]
}

// Featured post types
export interface FeaturedPost {
  _id: string
  title: string
  text?: string
  featuredSlot?: number
}

// User report types — fields match the backend UserReport GraphQL type
export interface UserReport {
  _id: string
  _reporterId: string
  _reportedUserId: string
  reason: string
  description?: string
  severity: string
  status: string
  adminNotes?: string
  createdAt: string
}


export interface ReceivedInvitesTableProps {
  invites: InviteRequest[]
  onRefresh: () => Promise<void>
}

export interface SentInvitesTableProps {
  invites: SentInvite[]
}

export interface InviteOverviewProps {
  counts: InviteCounts
  steps: string[]
}

export interface UserInviteRequestsTabProps {
  data: InviteRequest[]
  onRefresh: () => Promise<void>
}

export type InviteSortKey = 'email' | 'joined' | 'status'

export interface InviteSortState {
  key: InviteSortKey
  ascending: boolean
}
