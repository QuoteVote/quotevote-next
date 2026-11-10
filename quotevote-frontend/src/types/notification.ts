/**
 * TypeScript interfaces for notification-related types
 */

export interface NotificationUser {
  _id: string;
  name: string;
  avatar?: string | Record<string, unknown>;
  username: string;
  contributorBadge?: boolean;
}

export interface NotificationPost {
  _id: string;
  url: string;
  /** Set when the author or an admin deleted the post after the notification was sent. */
  deleted?: boolean | null;
}

export interface Notification {
  _id: string;
  userId: string;
  userIdBy?: string | null;
  /** Legacy rows can omit a sender; UI must tolerate null (#464 / #681). */
  userBy?: NotificationUser | null;
  label: string;
  status: string;
  created: string | number | Date;
  notificationType: 'FOLLOW' | 'UPVOTED' | 'DOWNVOTED' | 'COMMENTED' | 'QUOTED';
  post?: NotificationPost;
}

export interface NotificationPayload {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface NotificationHandler {
  notifySuccess: (message: string, options?: { duration?: number }) => void;
  notifyError: (message: string, options?: { duration?: number }) => void;
  notifyInfo: (message: string, options?: { duration?: number }) => void;
  notifyWarning: (message: string, options?: { duration?: number }) => void;
}

