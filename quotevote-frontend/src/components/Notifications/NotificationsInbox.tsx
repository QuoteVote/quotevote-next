"use client";

import { useState } from "react";
import { useMutation, useQuery, useSubscription } from "@apollo/client/react";
import { toast } from "sonner";
import { CLEAR_ALL_NOTIFICATIONS } from "@/graphql/mutations";
import {
  GET_NOTIFICATION_HISTORY,
  GET_NOTIFICATIONS,
  NOTIFICATION_HISTORY_LIMIT,
} from "@/graphql/queries";
import { NEW_NOTIFICATION_SUBSCRIPTION } from "@/graphql/subscriptions";
import { NotificationLists } from "@/components/Notifications/NotificationLists";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store";
import { useHasMounted } from "@/hooks/useMediaQuery";
import type { Notification } from "@/types/notification";
import { cn } from "@/lib/utils";

type InboxView = "active" | "history";

interface NotificationsInboxProps {
  pageView?: boolean;
  /** Called after a notification sends the user somewhere (e.g. to close the panel). */
  onNavigate?: () => void;
  className?: string;
}

const HISTORY_QUERY_OPTIONS = {
  query: GET_NOTIFICATION_HISTORY,
  variables: { limit: NOTIFICATION_HISTORY_LIMIT },
} as const;

/**
 * Active list + Notification History + Clear All (#464).
 * Soft-deleted rows stay queryable via `notificationHistory`.
 */
export function NotificationsInbox({
  pageView = false,
  onNavigate,
  className,
}: NotificationsInboxProps) {
  const hasMounted = useHasMounted();
  const userId = useAppStore(
    (state) => (state.user.data._id || state.user.data.id) as string | undefined
  );
  const [view, setView] = useState<InboxView>("active");

  const {
    loading: activeLoading,
    data: activeData,
    refetch: refetchActive,
    error: activeError,
  } = useQuery<{ notifications?: Notification[] }>(GET_NOTIFICATIONS, {
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });

  const {
    loading: historyLoading,
    data: historyData,
    refetch: refetchHistory,
    error: historyError,
  } = useQuery<{ notificationHistory?: Notification[] }>(GET_NOTIFICATION_HISTORY, {
    skip: !userId || view !== "history",
    variables: HISTORY_QUERY_OPTIONS.variables,
    fetchPolicy: "cache-and-network",
  });

  useSubscription(NEW_NOTIFICATION_SUBSCRIPTION, {
    variables: { userId: userId || "" },
    skip: !userId,
    onData: async () => {
      await refetchActive();
      if (view === "history") {
        await refetchHistory();
      }
    },
  });

  const [clearAll, { loading: clearing }] = useMutation<{ clearAllNotifications: number }>(
    CLEAR_ALL_NOTIFICATIONS,
    {
      refetchQueries: [{ query: GET_NOTIFICATIONS }, HISTORY_QUERY_OPTIONS],
    }
  );

  const pendingActive =
    !hasMounted || activeLoading || (Boolean(userId) && !activeData && !activeError);
  const pendingHistory =
    !hasMounted ||
    historyLoading ||
    (Boolean(userId) && view === "history" && !historyData && !historyError);

  const activeNotifications = activeData?.notifications ?? [];
  const historyNotifications = historyData?.notificationHistory ?? [];
  const notifications = view === "active" ? activeNotifications : historyNotifications;
  const pending = view === "active" ? pendingActive : pendingHistory;
  const error = view === "active" ? activeError : historyError;

  const handleClearAll = async (): Promise<void> => {
    if (activeNotifications.length === 0 || clearing) return;
    try {
      await clearAll();
    } catch {
      toast.error("Couldn't clear your notifications. Please try again.");
    }
  };

  const handleRetry = (): void => {
    if (view === "active") {
      void refetchActive();
    } else {
      void refetchHistory();
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)} data-testid="notifications-inbox">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={view === "active" ? "secondary" : "ghost"}
            size="sm"
            className="h-8"
            onClick={() => setView("active")}
            aria-pressed={view === "active"}
          >
            Active
            {activeNotifications.length > 0 ? ` (${activeNotifications.length})` : ""}
          </Button>
          <Button
            type="button"
            variant={view === "history" ? "secondary" : "ghost"}
            size="sm"
            className="h-8"
            onClick={() => setView("history")}
            aria-pressed={view === "history"}
            data-testid="notification-history-tab"
          >
            History
          </Button>
        </div>

        {view === "active" && activeNotifications.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={clearing}
            onClick={() => void handleClearAll()}
            data-testid="clear-all-notifications"
          >
            Clear all
          </Button>
        )}
      </div>

      {pending ? (
        <div className="space-y-3" aria-busy="true" data-testid="notifications-loading">
          <span className="sr-only">Loading notifications</span>
          {Array.from({ length: pageView ? 5 : 3 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="flex items-center gap-3 p-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-8 text-center"
        >
          <div>
            <p className="text-sm font-medium text-foreground">
              We couldn&apos;t load your notifications.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Check your connection and try again.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleRetry}>
            Try again
          </Button>
        </div>
      ) : (
        <NotificationLists
          notifications={notifications}
          pageView={pageView}
          mode={view}
          onNavigate={onNavigate}
          emptyTitle={view === "history" ? "No cleared notifications yet" : "You're all caught up!"}
          emptyDescription={
            view === "history" ? "Cleared alerts will show up here." : "No alerts right now."
          }
        />
      )}
    </div>
  );
}
