/**
 * Chat-related TypeScript types
 * Includes message, participant, and handler definitions
 */

/**
 * Basic participant information used across chat UIs
 */
export interface ChatParticipant {
    /** Backend identifier (GraphQL `id`) */
    id: string
    /** Public username */
    username: string
    /** Optional display name */
    name?: string
    /** Optional avatar URL */
    avatar?: string
    /** Optional contributor badge or role */
    contributorBadge?: string
    /** Additional metadata */
    [key: string]: unknown
}

/**
 * Buddy search result from `searchUser` GraphQL query
 * Note: The backend currently returns `_id`; we keep it alongside `id`
 */
export interface BuddySearchResult extends ChatParticipant {
    /** Mongo-style identifier from GraphQL (`_id`) */
    _id: string
}

/**
 * Message structure for chat rooms, aligned with NEW_MESSAGE_SUBSCRIPTION
 */
export interface ChatMessage {
    /** Unique message identifier */
    _id: string
    /** Room identifier the message belongs to */
    messageRoomId: string
    /** Author user identifier */
    userId: string
    /** Author username */
    userName?: string
    /** Optional message title or subject */
    title?: string
    /** Text content of the message */
    text?: string
    /** ISO timestamp of creation */
    created: string
    /** Message type (e.g., system, user) */
    type?: string
    /** Mutation type (e.g., created/updated/deleted) */
    mutation_type?: string
    /** Additional backend fields */
    [key: string]: unknown
}

/**
 * Handler that processes or sends a single chat message
 */
export type ChatMessageHandler = (message: ChatMessage) => void | Promise<void>

/**
 * Handler used when adding a buddy from search or roster UIs
 */
export type AddBuddyHandler = (userId: string) => Promise<void>

/**
 * Chat room metadata used across chat UIs
 * Mirrors the fields returned by GET_CHAT_ROOMS
 */
export interface ChatRoom {
    /** Room identifier */
    _id: string
    /** Participants (user ids) */
    users?: Array<string | { toString: () => string }> | null
    /** Room type: USER (DM) or POST (group for a quote) */
    messageType?: string | null
    /** Room title (for groups or resolved DM display) */
    title?: string | null
    /** Optional avatar URL resolved by backend */
    avatar?: string | null
    /** ISO timestamp when room was created */
    created: string
    /** ISO timestamp of last message */
    lastMessageTime?: string | null
    /** ISO timestamp of last activity (message or read receipt) */
    lastActivity?: string | null
    /** Number of unread messages for current user */
    unreadMessages?: number | null
    /** Optional post details for POST rooms */
    postDetails?: {
        _id?: string
        title?: string | null
        text?: string | null
    } | null
}
