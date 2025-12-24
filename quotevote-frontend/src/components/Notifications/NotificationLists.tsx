'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useApolloClient } from '@apollo/client/react';
import moment from 'moment';
import { X } from 'lucide-react';
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

const getBadgeIcon = (notificationType: Notification['notificationType']): string => {
  switch (notificationType) {
    case 'FOLLOW':
      return '/assets/PlusSign.svg';
    case 'UPVOTED':
      return '/assets/UpVoteBadge.png';
    case 'DOWNVOTED':
      return '/assets/DownVoteBadge.png';
    case 'COMMENTED':
      return '/assets/CommentBadge.png';
    case 'QUOTED':
      return '/assets/QouteBadge.png';
    default:
      return '';
  }
};

const stringLimit = (str: string, limit: number): string => {
  if (str.length <= limit) return str;
  return `${str.slice(0, limit)}...`;
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
    if (notificationType === 'FOLLOW') {
      router.push(`/Profile/${userBy.username}`);
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
          'bg-[var(--color-white)]'
        )}
      >
        <img src="/assets/ZeroNotificationsBG.png" alt="No notifications" />
        <p className="text-sm text-[var(--color-text-secondary)] mt-4">
          Relax, you don&apos;t have any alerts right now.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-[var(--color-white)] relative overflow-auto',
        pageView ? 'w-full' : 'w-[350px]',
        notifications.length < 5 ? 'min-h-0' : 'h-[75vh]'
      )}
    >
      <ul className="divide-y divide-[var(--color-gray-light)]">
        {notifications.map((notification) => {
          const badgeIcon = getBadgeIcon(notification.notificationType);
          const avatarUrl =
            notification.userBy.avatar?.url ||
            (typeof notification.userBy.avatar === 'string'
              ? notification.userBy.avatar
              : undefined);

          return (
            <li
              key={notification._id}
              className="flex items-start gap-3 p-3 hover:bg-[var(--color-gray-light)] transition-colors cursor-pointer group"
              onClick={() =>
                handleNotificationClick(
                  notification.notificationType,
                  notification.userBy,
                  notification.post
                )
              }
            >
              <div className="relative flex-shrink-0">
                <div className="relative">
                  <Avatar
                    src={avatarUrl}
                    alt={notification.userBy.name || notification.userBy.username}
                    size="md"
                  />
                  {badgeIcon && (
                    <img
                      src={badgeIcon}
                      alt={notification.notificationType}
                      className="absolute -bottom-1 -right-1 w-5 h-5"
                    />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--color-text-primary)]">
                  <span className="font-semibold">{notification.notificationType}.</span>{' '}
                  {`"${stringLimit(notification.label, pageView ? 1000 : 50)}"`}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {moment(notification.created).calendar(null, {
                    sameDay: '[Today]',
                    nextDay: '[Tomorrow]',
                    nextWeek: 'dddd',
                    lastDay: '[Yesterday]',
                    lastWeek: '[Last] dddd',
                    sameElse: 'MMM DD, YYYY',
                  })}{' '}
                  @ {moment(notification.created).format('h:mm A')}
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}

