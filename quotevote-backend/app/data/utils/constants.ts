export const SubscriptionEvents = {
  MESSAGE_CREATED: 'MESSAGE_CREATED',
  USER_MESSAGE_CREATED: 'USER_MESSAGE_CREATED',
  USER_REACTION: 'USER_REACTION',
  COMMENT_CREATED: 'COMMENT_CREATED',
  NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
} as const;

export type SubscriptionEvent =
  typeof SubscriptionEvents[keyof typeof SubscriptionEvents];

// Export individual constants for backward compatibility, ensuring existing imports continue to function.

export const MESSAGE_CREATED = SubscriptionEvents.MESSAGE_CREATED;
export const USER_MESSAGE_CREATED = SubscriptionEvents.USER_MESSAGE_CREATED;
export const USER_REACTION = SubscriptionEvents.USER_REACTION;
export const COMMENT_CREATED = SubscriptionEvents.COMMENT_CREATED;
export const NOTIFICATION_CREATED = SubscriptionEvents.NOTIFICATION_CREATED;

export const AccountStatusValues = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
} as const;

export const VoteTypeValues = {
  UP: 'up',
  DOWN: 'down',
} as const;

export const RosterStatusValues = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  BLOCKED: 'blocked',
} as const;

export const MessageTypeValues = {
  USER: 'USER',
  POST: 'POST',
  SYSTEM: 'SYSTEM',
} as const;

export const NotificationTypeValues = {
  FOLLOW: 'FOLLOW',
  VOTE: 'VOTE',
  COMMENT: 'COMMENT',
  QUOTE: 'QUOTE',
  MESSAGE: 'MESSAGE',
  MENTION: 'MENTION',
  SYSTEM: 'SYSTEM',
  UPVOTED: 'UPVOTED',
  DOWNVOTED: 'DOWNVOTED',
} as const;

export const ActivityEventTypeValues = {
  POSTED: 'POSTED',
  VOTED: 'VOTED',
  COMMENTED: 'COMMENTED',
  QUOTED: 'QUOTED',
  LIKED: 'LIKED',
  UPVOTED: 'UPVOTED',
  DOWNVOTED: 'DOWNVOTED',
} as const;

export const GroupPrivacyValues = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  RESTRICTED: 'restricted',
} as const;

export const InviteStatusValues = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
} as const;

export const ReportStatusValues = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const;

export const ReportSeverityValues = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const ReportReasonValues = {
  SPAM: 'spam',
  HARASSMENT: 'harassment',
  INAPPROPRIATE_CONTENT: 'inappropriate_content',
  FAKE_ACCOUNT: 'fake_account',
  OTHER: 'other',
} as const;

export const PresenceStatusValues = {
  ONLINE: 'online',
  AWAY: 'away',
  DND: 'dnd',
  INVISIBLE: 'invisible',
  OFFLINE: 'offline',
} as const;

