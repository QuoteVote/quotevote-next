'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useApolloClient } from '@apollo/client/react';
import moment from 'moment';
import { X, UserPlus, ArrowUp, ArrowDown, MessageSquare, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Avatar from '@/components/Avatar';
import { DELETE_NOTIFICATION } from '@/graphql/mutations';
import { GET_NOTIFICATIONS } from '@/graphql/queries';
import { useAppStore } from '@/store';
import useGuestGuard from '@/hooks/useGuestGuard';
import type { Notification } from '@/types/notification';
import { cn } from '@/lib/utils';

interface NotificationListsProps {
  notifications: Notification[];
  pageView?: boolean;
}

const getNotificationIcon = (notificationType: Notification['notificationType']) => {
  switch (notificationType) {
    case 'FOLLOW':
      return <UserPlus className="h-4 w-4 text-primary" />;
    case 'UPVOTED':
      return <ArrowUp className="h-4 w-4 text-primary" />;
    case 'DOWNVOTED':
      return <ArrowDown className="h-4 w-4 text-destructive" />;
    case 'COMMENTED':
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case 'QUOTED':
      return <Quote className="h-4 w-4 text-purple-500" />;
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
  return moment(created).fromNow();
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
      router.push(post.url.replace(/\?/g, ''));
    }
  };

  if (!notifications || notifications.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center',
          pageView ? 'h-full' : 'h-[30vh]',
          'bg-card rounded-lg'
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/ZeroNotificationsBG.png" alt="No notifications" />
        <p className="text-sm text-muted-foreground mt-4">
          Relax, you don&apos;t have any alerts right now.
        </p>
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
          const avatarUrl =
            notification.userBy.avatar?.url ||
            (typeof notification.userBy.avatar === 'string'
              ? notification.userBy.avatar
              : undefined);

          const actionText = getNotificationActionText(notification.notificationType);
          const icon = getNotificationIcon(notification.notificationType);
          const displayName = notification.userBy.name || notification.userBy.username;

          return (
            <div
              key={notification._id}
              className="bg-card rounded-lg p-4 border border-border hover:bg-accent/50 transition-colors cursor-pointer group"
              onClick={() =>
                handleNotificationClick(
                  notification.notificationType,
                  notification.userBy,
                  notification.post
                )
              }
            >
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <Avatar
                    src={avatarUrl}
                    alt={displayName}
                    size="md"
                  />
                  {icon && (
                    <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-0.5 border border-border">
                      {icon}
                    </div>
                  )}
                </div>

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
