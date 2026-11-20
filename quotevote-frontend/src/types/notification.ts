/**
 * TypeScript interfaces for notification-related types
 */

import type { ElementType } from 'react';

export interface NotificationUser {
  _id: string;
  name: string;
  avatar?: string | Record<string, unknown>;
  username: string;
  contributorBadge?: boolean;
}

export interface NotificationPost {
  _id: string;
  title?: string | null;
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
  /** `new` (unread) or `read`; cleared ones aren't listed. */
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

/** The filters of the Notifications panel (updated design). */
export type NotificationFilter = 'all' | 'votes' | 'comments' | 'quotes' | 'follows';

export interface NotificationListsProps {
  /** Already filtered; grouped into Today and Earlier here. */
  notifications: Notification[];
  /** Called after a notification sends the user somewhere (e.g. to close the panel). */
  onNavigate?: () => void;
  /** When × removes the last row, focus moves here (the filters). */
  onListEmptied?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export interface NotificationsInboxProps {
  onNavigate?: () => void;
  /** Shows the close button (the desktop panel). */
  onClose?: () => void;
  initialFilter?: NotificationFilter;
  /** The title element: an h1 on the page, the sheet's title in the panel. */
  TitleAs?: ElementType;
  DescriptionAs?: ElementType;
}
