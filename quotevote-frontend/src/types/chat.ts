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
    /** Optional avatar URL or avataaars data object */
    avatar?: string | Record<string, unknown>
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
    /** Optional avatar URL or avataaars qualities resolved by backend */
    avatar?: string | Record<string, unknown> | null
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
        url?: string | null
    } | null
}

/**
 * Extended chat message with additional user and read status information
 */
export interface ExtendedChatMessage extends ChatMessage {
  user?: {
    _id?: string;
    name?: string;
    username?: string;
    avatar?: string | null | undefined | Record<string, unknown>;
    [key: string]: unknown;
  };
  readBy?: Array<string | { toString(): string } | null | undefined>;
}

/**
 * Props for MessageItem component
 */
export interface MessageItemProps {
  message: ExtendedChatMessage;
}

/**
 * Props for MessageSend component
 */
export interface MessageSendProps {
  messageRoomId?: string | null;
  type: string;
  title?: string | null;
  /**
   * For DMs started from a profile or post, this is
   * the target user / component identifier when a room
   * does not yet exist.
   */
  componentId?: string | null;
}

/**
 * Chat user information
 */
export interface ChatUser {
  _id?: string;
  name?: string;
  username?: string;
  avatar?: string;
}

/**
 * Chat room reference for selected room state
 */
export interface ChatRoomRef {
  users?: (string | { toString(): string })[];
}

/**
 * Selected room state interface
 */
export interface SelectedRoomState {
  room?: ChatRoomRef;
  users?: (string | { toString(): string })[];
}

/**
 * Typing indicator props
 */
export interface TypingIndicatorProps {
  messageRoomId?: string | null;
}

/**
 * Typing user information
 */
export interface TypingUser {
  userId: string;
  user?: {
    name?: string | null;
    username?: string | null;
  } | null;
  timestamp: string;
}

/**
 * Staged (not yet persisted) DM room — used when starting a new conversation
 * before the first message has been sent.
 */
export interface StagedChatRoom {
  _id: null;
  title: string;
  avatar: string | Record<string, unknown> | null;
  messageType: 'USER';
  users: string[];
  username?: string;
}

/**
 * Presence status type
 */
export type PresenceStatus = 'online' | 'away' | 'dnd' | 'offline' | 'invisible';

/**
 * A status a user can choose for themselves. `offline` is never chosen; it only
 * describes someone who has no declared status. The wire value `online` is
 * shown to people as "Available" (#468).
 */
export type DeclaredPresenceStatus = Exclude<PresenceStatus, 'offline'>;

/**
 * The statuses other people can see. `invisible` and `offline` show nothing (#468).
 */
export type PublicPresenceStatus = Extract<PresenceStatus, 'online' | 'away' | 'dnd'>;

/**
 * One row of the status picker
 */
export interface PresenceStatusOption {
  value: DeclaredPresenceStatus;
  label: string;
  icon: string;
}

/**
 * What the public may see of someone's declared availability (#468)
 */
export interface PublicPresence {
  status: PublicPresenceStatus;
  /** Trimmed, `''` when none was set */
  statusMessage: string;
}

/**
 * Presence icon props
 */
export interface PresenceIconProps {
  status: PresenceStatus;
  className?: string;
}

/**
 * The tag (group) a discussion's post belongs to, shown on its card as #title (#531)
 */
export interface ConversationTag {
  groupId: string;
  title: string;
}

/** Someone taking part in a conversation, used to match `@user` searches */
export interface ConversationPerson {
  username?: string | null;
  name?: string | null;
}

/**
 * What a conversation can be found by in the Messages search (#531): its
 * title and post, the text of its messages, the people in it and its tag.
 */
export interface ConversationSearchContext {
  messages: string[];
  people: ConversationPerson[];
  tag?: ConversationTag | null;
}

/** Message text and authors per room, fetched only while searching */
export interface ChatRoomSearchMessage {
  _id: string;
  text?: string | null;
  userId?: string | null;
  user?: { _id: string; username?: string | null; name?: string | null } | null;
}

export interface GetChatRoomSearchData {
  messageRooms: Array<{ _id: string; messages?: ChatRoomSearchMessage[] | null } | null> | null;
}

export interface ChatSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

export interface AddBuddyPanelProps {
  onBack: () => void;
}
