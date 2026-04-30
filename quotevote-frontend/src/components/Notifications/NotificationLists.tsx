'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useApolloClient } from '@apollo/client/react';
import moment from 'moment';
import { X, UserPlus, ArrowUp, ArrowDown, MessageSquare, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DELETE_NOTIFICATION } from '@/graphql/mutations';
import { GET_NOTIFICATIONS } from '@/graphql/queries';
import { useAppStore } from '@/store';
import useGuestGuard from '@/hooks/useGuestGuard';
import { toAppPostUrl } from '@/lib/utils/sanitizeUrl';
import type { Notification } from '@/types/notification';
import { cn } from '@/lib/utils';

interface NotificationListsProps {
  notifications: Notification[];
  pageView?: boolean;
}

const getNotificationIcon = (notificationType: Notification['notificationType']) => {
  switch (notificationType) {
    case 'FOLLOW':
      return (
        <span className="flex items-center justify-center size-7 rounded-full bg-blue-100 dark:bg-blue-900/40 shadow-sm ring-1 ring-blue-200/50 dark:ring-blue-800/50">
          <UserPlus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        </span>
      );
    case 'UPVOTED':
      return (
        <span className="flex items-center justify-center size-7 rounded-full bg-green-100 dark:bg-green-900/40 shadow-sm ring-1 ring-green-200/50 dark:ring-green-800/50">
          <ArrowUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        </span>
      );
    case 'DOWNVOTED':
      return (
        <span className="flex items-center justify-center size-7 rounded-full bg-red-100 dark:bg-red-900/40 shadow-sm ring-1 ring-red-200/50 dark:ring-red-800/50">
          <ArrowDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
        </span>
      );
    case 'COMMENTED':
      return (
        <span className="flex items-center justify-center size-7 rounded-full bg-purple-100 dark:bg-purple-900/40 shadow-sm ring-1 ring-purple-200/50 dark:ring-purple-800/50">
          <MessageSquare className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
        </span>
      );
    case 'QUOTED':
      return (
        <span className="flex items-center justify-center size-7 rounded-full bg-amber-100 dark:bg-amber-900/40 shadow-sm ring-1 ring-amber-200/50 dark:ring-amber-800/50">
          <Quote className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        </span>
      );
    default:
      return null;
  }
};

const getNotificationActionText = (notificationType: Notification['notificationType']): string => {
  switch (notificationType) {
    case 'FOLLOW':
      return 'started following you';
    case 'UPVOTED':
      return 'upvoted your post';
    case 'DOWNVOTED':
      return 'downvoted your post';
    case 'COMMENTED':
      return 'commented on your post';
    case 'QUOTED':
      return 'quoted your post';
    default:
      return '';
  }
};

const stringLimit = (str: string, limit: number): string => {
  if (str.length <= limit) return str;
  return `${str.slice(0, limit)}...`;
};

const formatTimeAgo = (created: string | number | Date): string => {
  return moment(created).calendar(null, {
    sameDay: '[Today at] h:mm A',
    lastDay: '[Yesterday at] h:mm A',
    lastWeek: '[Last] dddd [at] h:mm A',
    sameElse: 'MMM D, YYYY [at] h:mm A',
  });
};

export function NotificationLists({ notifications, pageView = false }: NotificationListsProps) {
  const router = useRouter();
  const client = useApolloClient();
  const ensureAuth = useGuestGuard();
  const setSelectedPost = useAppStore((state) => state.setSelectedPost);

  const [removeNotification] = useMutation(DELETE_NOTIFICATION);

  const handleDelete = async (notificationId: string): Promise<void> => {
    if (!ensureAuth()) return;

    const newNotifications = notifications.filter(
      (notification) => notification._id !== notificationId
    );

    client.writeQuery({
      query: GET_NOTIFICATIONS,
      data: { notifications: newNotifications },
    });

    await removeNotification({
      variables: {
        notificationId,
      },
      refetchQueries: [
        {
          query: GET_NOTIFICATIONS,
        },
      ],
    });
  };

  const handleNotificationClick = (
    notificationType: Notification['notificationType'],
    userBy: Notification['userBy'],
    post?: Notification['post']
  ): void => {
    if (!ensureAuth()) return;

    if (notificationType === 'FOLLOW') {
      router.push(`/dashboard/profile/${userBy.username}`);
    } else if (post) {
      setSelectedPost(post._id);
      router.push(toAppPostUrl(post.url));
    }
  };

  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
        <p className="text-sm font-medium text-foreground">You&apos;re all caught up!</p>
        <p className="text-xs text-muted-foreground mt-1">No alerts right now.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-auto',
        pageView ? 'w-full' : 'w-full max-w-sm',
        notifications.length < 5 ? 'min-h-0' : 'max-h-[75vh]'
      )}
    >
      <div className="space-y-2">
        {notifications.map((notification) => {
          const actionText = getNotificationActionText(notification.notificationType);
          const icon = getNotificationIcon(notification.notificationType);
          const displayName = notification.userBy.name || notification.userBy.username;

          return (
            <div
              key={notification._id}
              className="bg-card rounded-lg p-4 border border-border hover:bg-accent/50 transition-colors cursor-pointer group focus-visible:ring-2 focus-visible:ring-primary"
              role="button"
              tabIndex={0}
              onClick={() =>
                handleNotificationClick(
                  notification.notificationType,
                  notification.userBy,
                  notification.post
                )
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleNotificationClick(
                    notification.notificationType,
                    notification.userBy,
                    notification.post
                  );
                }
              }}
            >
              <div className="flex items-start gap-3">
                {icon && (
                  <div className="flex-shrink-0 mt-0.5">
                    {icon}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{displayName}</span>{' '}
                    <span className="text-muted-foreground">{actionText}</span>
                  </p>
                  {notification.notificationType !== 'FOLLOW' && notification.label && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      &ldquo;{stringLimit(notification.label, pageView ? 1000 : 50)}&rdquo;
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(notification.created)}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification._id);
                  }}
                  aria-label="Delete notification"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
