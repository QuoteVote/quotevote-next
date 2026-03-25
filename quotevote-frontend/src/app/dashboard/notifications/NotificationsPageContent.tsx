'use client';

import { useQuery, useSubscription } from '@apollo/client/react';
import { Bell } from 'lucide-react';
import { GET_NOTIFICATIONS } from '@/graphql/queries';
import { NEW_NOTIFICATION_SUBSCRIPTION } from '@/graphql/subscriptions';
import { useAppStore } from '@/store';
import { NotificationLists } from '@/components/Notifications/NotificationLists';
import { Skeleton } from '@/components/ui/skeleton';
import type { Notification } from '@/types/notification';

export function NotificationsPageContent() {
  const userId = useAppStore((state) => state.user.data.id);

  const { loading, data, refetch, error } = useQuery(GET_NOTIFICATIONS, {
    skip: !userId,
  });

  useSubscription(NEW_NOTIFICATION_SUBSCRIPTION, {
    variables: { userId: userId || '' },
    skip: !userId,
    onData: async () => {
      await refetch();
    },
  });

  const notifications: Notification[] =
    loading || error || !data
      ? []
      : (data as { notifications?: Notification[] }).notifications || [];

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        </div>
        {!loading && notifications.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <NotificationLists notifications={notifications} pageView />
      )}
    </div>
  );
}
