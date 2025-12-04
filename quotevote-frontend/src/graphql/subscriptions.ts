import { gql } from '@apollo/client'

/**
 * Presence subscription - subscribes to user presence updates
 */
export const PRESENCE_SUBSCRIPTION = gql`
  subscription PresenceSubscription($userId: ID) {
    presence(userId: $userId) {
      userId
      isOnline
      lastSeen
    }
  }
`
