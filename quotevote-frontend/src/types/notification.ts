/**
 * TypeScript interfaces for notification-related types
 */

export interface NotificationUser {
  _id: string;
  name: string;
  avatar?: {
    url?: string;
    [key: string]: unknown;
  };
  username: string;
  contributorBadge?: boolean;
}

export interface NotificationPost {
  _id: string;
  url: string;
}

export interface Notification {
  _id: string;
  userId: string;
  userIdBy: string;
  userBy: NotificationUser;
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

