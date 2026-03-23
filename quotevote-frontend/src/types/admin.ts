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
  status: string
}

export interface UserInviteRequestsResponse {
  userInviteRequests: InviteRequest[]
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

// User report types
export interface UserReport {
  _id: string
  reportedUser: {
    _id: string
    username: string
    name?: string
    avatar?: string
  }
  reportedBy: {
    _id: string
    username: string
    name?: string
    avatar?: string
  }
  reason: string
  description?: string
  severity?: string
  created: string
  status?: string
}

