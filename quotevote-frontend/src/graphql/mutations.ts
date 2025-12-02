import { gql } from '@apollo/client'

/**
 * Heartbeat mutation to keep presence alive
 */
export const HEARTBEAT = gql`
  mutation Heartbeat {
    heartbeat {
      success
      timestamp
    }
  }
`

/**
 * Add buddy mutation (send friend request)
 */
export const ADD_BUDDY = gql`
  mutation AddBuddy($roster: RosterInput!) {
    addBuddy(roster: $roster) {
      id
      buddyId
      status
      createdAt
    }
  }
`

/**
 * Accept buddy request mutation
 */
export const ACCEPT_BUDDY = gql`
  mutation AcceptBuddy($rosterId: ID!) {
    acceptBuddy(rosterId: $rosterId) {
      id
      status
      updatedAt
    }
  }
`

/**
 * Decline buddy request mutation
 */
export const DECLINE_BUDDY = gql`
  mutation DeclineBuddy($rosterId: ID!) {
    declineBuddy(rosterId: $rosterId) {
      id
      status
      updatedAt
    }
  }
`

/**
 * Block buddy mutation
 */
export const BLOCK_BUDDY = gql`
  mutation BlockBuddy($buddyId: ID!) {
    blockBuddy(buddyId: $buddyId) {
      id
      status
      updatedAt
    }
  }
`

/**
 * Unblock buddy mutation
 */
export const UNBLOCK_BUDDY = gql`
  mutation UnblockBuddy($buddyId: ID!) {
    unblockBuddy(buddyId: $buddyId) {
      id
      status
      updatedAt
    }
  }
`

/**
 * Remove buddy mutation
 */
export const REMOVE_BUDDY = gql`
  mutation RemoveBuddy($buddyId: ID!) {
    removeBuddy(buddyId: $buddyId) {
      success
      message
    }
  }
`

/**
 * Update typing indicator mutation
 */
export const UPDATE_TYPING = gql`
  mutation UpdateTyping($typing: TypingInput!) {
    updateTyping(typing: $typing) {
      success
      messageRoomId
      isTyping
    }
  }
`

/**
 * Send password reset email mutation
 */
export const SEND_PASSWORD_RESET_EMAIL = gql`
  mutation SendPasswordResetEmail($email: String!) {
    sendPasswordResetEmail(email: $email)
  }
`

/**
 * Update user password mutation
 */
export const UPDATE_USER_PASSWORD = gql`
  mutation UpdateUserPassword(
    $username: String!
    $password: String!
    $token: String!
  ) {
    updateUserPassword(username: $username, password: $password, token: $token)
  }
`
