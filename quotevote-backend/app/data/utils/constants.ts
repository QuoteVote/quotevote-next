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
