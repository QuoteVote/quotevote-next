/**
 * PostChat-related TypeScript types
 * Used for post chat messages, reactions, and related components
 */

/**
 * User information attached to a post chat message
 */
export interface PostChatUser {
  /** Display name */
  name: string
  /** Username handle */
  username: string
  /** Avatar URL */
  avatar?: string
}

/**
 * Post chat message structure
 */
export interface PostChatMessageData {
  /** Unique message identifier */
  _id: string
  /** Author user identifier */
  userId: string
  /** Text content of the message */
  text: string
  /** ISO timestamp of creation */
  created: string
  /** User details */
  user: PostChatUser
}

/**
 * Message reaction structure
 */
export interface MessageReaction {
  /** Unique reaction identifier */
  _id: string
  /** Emoji character */
  emoji: string
  /** Message this reaction belongs to */
  messageId: string
  /** User who made this reaction */
  userId: string
}

/**
 * Props for PostChatMessage component
 */
export interface PostChatMessageProps {
  /** The message data to display */
  message: PostChatMessageData
}

/**
 * Props for PostChatReactions component
 */
export interface PostChatReactionsProps {
  /** ISO timestamp when message was created */
  created: string
  /** Message identifier for reactions */
  messageId: string
  /** Array of reactions on the message */
  reactions?: MessageReaction[]
  /** Whether message is from another user (affects styling) */
  isDefaultDirection: boolean
  /** Display name of message author */
  userName: string
  /** Username handle of message author */
  username: string
}

/**
 * Props for PostChatSend component
 */
export interface PostChatSendProps {
  /** Room ID for the message (null if room doesn't exist yet) */
  messageRoomId?: string | null
  /** Title for the message/room */
  title?: string
  /** Post ID for creating room if needed */
  postId?: string
}

/**
 * Input for creating a new message reaction
 */
export interface ReactionInput {
  userId: string
  messageId: string
  emoji: string
}
