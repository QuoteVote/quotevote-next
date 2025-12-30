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

