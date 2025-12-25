import { gql } from '@apollo/client'

/**
 * Presence subscription - subscribes to user presence updates
 * When userId is null, subscribes to all users' presence updates
 */
export const PRESENCE_SUBSCRIPTION = gql`
  subscription presence($userId: String) {
    presence(userId: $userId) {
      userId
      status
      statusMessage
      lastSeen
    }
  }
`

/**
 * New notification subscription - subscribes to notifications including post updates
 */
export const NEW_NOTIFICATION_SUBSCRIPTION = gql`
  subscription notification($userId: String!) {
    notification(userId: $userId) {
      _id
      userId
      userIdBy
      userBy {
        name
        avatar
      }
      label
      status
      created
      notificationType
      post {
        _id
        url
      }
    }
  }
`

/**
 * New message subscription - subscribes to new messages in a message room
 */
export const NEW_MESSAGE_SUBSCRIPTION = gql`
  subscription newMessage($messageRoomId: String!) {
    message(messageRoomId: $messageRoomId) {
      _id
      messageRoomId
      userId
      userName
      title
      text
      created
      type
      mutation_type
    }
  }
`

/**
 * Typing subscription - subscribes to typing events in a message room
 */
export const TYPING_SUBSCRIPTION = gql`
  subscription typing($messageRoomId: String!) {
    typing(messageRoomId: $messageRoomId) {
      messageRoomId
      userId
      user {
        _id
        name
        username
      }
      isTyping
      timestamp
    }
  }
`

/**
 * Roster subscription - subscribes to roster (buddy list) updates
 */
export const ROSTER_SUBSCRIPTION = gql`
  subscription roster($userId: String!) {
    roster(userId: $userId) {
      _id
      userId
      buddyId
      status
      initiatedBy
      created
      updated
      buddy {
        _id
        name
        username
        avatar
      }
    }
  }
`
