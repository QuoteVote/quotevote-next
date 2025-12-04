import { gql } from '@apollo/client'

/**
 * Get buddy list query
 */
export const GET_BUDDY_LIST = gql`
  query GetBuddyList {
    buddyList {
      id
      buddyId
      status
      buddy {
        id
        username
        avatar
      }
    }
  }
`

/**
 * Get roster query (includes pending requests and blocked users)
 */
export const GET_ROSTER = gql`
  query GetRoster {
    roster {
      buddies {
        id
        buddyId
        status
        buddy {
          id
          username
          avatar
        }
      }
      pendingRequests {
        id
        buddyId
        status
        buddy {
          id
          username
          avatar
        }
      }
      blockedUsers {
        id
        username
        avatar
      }
    }
  }
`

/**
 * Verify password reset token query
 */
export const VERIFY_PASSWORD_RESET_TOKEN = gql`
  query VerifyUserPasswordResetToken($token: String!) {
    verifyUserPasswordResetToken(token: $token)
  }
`
