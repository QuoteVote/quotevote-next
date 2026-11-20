"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useSubscription } from "@apollo/client/react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { MARK_ALL_NOTIFICATIONS_READ } from "@/graphql/mutations";
import { GET_NOTIFICATIONS } from "@/graphql/queries";
import { NEW_NOTIFICATION_SUBSCRIPTION } from "@/graphql/subscriptions";
import { NotificationLists } from "@/components/Notifications/NotificationLists";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store";
import { useHasMounted } from "@/hooks/useMediaQuery";
import type {
  Notification,
  NotificationFilter,
  NotificationsInboxProps,
} from "@/types/notification";

/** The design's filters, and the kinds each one shows. */
export const NOTIFICATION_FILTERS: {
  id: NotificationFilter;
  label: string;
  kinds?: Notification["notificationType"][];
}[] = [
  { id: "all", label: "All" },
  { id: "votes", label: "Votes", kinds: ["UPVOTED", "DOWNVOTED"] },
  { id: "comments", label: "Comments", kinds: ["COMMENTED"] },
  { id: "quotes", label: "Quotes", kinds: ["QUOTED"] },
  { id: "follows", label: "Follows", kinds: ["FOLLOW"] },
];

const EMPTY_TEXT: Record<NotificationFilter, string> = {
  all: "No alerts right now.",
  votes: "No votes on your posts yet.",
  comments: "No comments on your posts yet.",
  quotes: "No quotes from your posts yet.",
  follows: "No new followers yet.",
};

export function unreadSummary(unread: number): string {
  if (unread === 0) return "Nothing new since you last checked";
  return `${unread} new since you last checked`;
}

/**
 * Notifications in the updated design: the title with the unread count and Mark all
 * read, the All / Votes / Comments / Quotes / Follows filters, and the rows grouped by
 * day. The panel and the /notifications page both use it.
 */
export function NotificationsInbox({
  onNavigate,
  onClose,
  initialFilter = "all",
  TitleAs = "h1",
  DescriptionAs = "p",
}: NotificationsInboxProps) {
  const hasMounted = useHasMounted();
  const userId = useAppStore(
    (state) => (state.user.data._id || state.user.data.id) as string | undefined
  );
  const [filter, setFilter] = useState<NotificationFilter>(initialFilter);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const { loading, data, refetch, error, client } = useQuery<{ notifications?: Notification[] }>(
    GET_NOTIFICATIONS,
    { skip: !userId, fetchPolicy: "cache-and-network" }
  );

  useSubscription(NEW_NOTIFICATION_SUBSCRIPTION, {
    variables: { userId: userId || "" },
    skip: !userId,
    onData: async () => {
      await refetch();
    },
  });

  const [markAllRead, { loading: marking }] = useMutation<{ markAllNotificationsRead: number }>(
    MARK_ALL_NOTIFICATIONS_READ
  );

  const notifications = data?.notifications ?? [];
  const unread = notifications.filter((n) => n.status === "new").length;
  const pending = !hasMounted || (loading && !data) || (Boolean(userId) && !data && !error);
  const kinds = NOTIFICATION_FILTERS.find((f) => f.id === filter)?.kinds;
  const shown = kinds
    ? notifications.filter((n) => kinds.includes(n.notificationType))
    : notifications;

  const handleMarkAllRead = async (): Promise<void> => {
    if (unread === 0 || marking) return;
    const before = notifications;
    client.writeQuery({
      query: GET_NOTIFICATIONS,
      data: {
        notifications: before.map((n) => (n.status === "new" ? { ...n, status: "read" } : n)),
      },
    });
    try {
      await markAllRead();
    } catch {
      client.writeQuery({ query: GET_NOTIFICATIONS, data: { notifications: before } });
      toast.error("Couldn't mark your notifications read. Please try again.");
    }
  };

  /** Arrow keys move between filters, as in a tab list. */
  const onTabKey = (event: React.KeyboardEvent, index: number) => {
    const last = NOTIFICATION_FILTERS.length - 1;
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % NOTIFICATION_FILTERS.length
        : event.key === "ArrowLeft"
          ? (index - 1 + NOTIFICATION_FILTERS.length) % NOTIFICATION_FILTERS.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : -1;
    if (next < 0) return;
    event.preventDefault();
    const id = NOTIFICATION_FILTERS[next].id;
    setFilter(id);
    tabRefs.current[id]?.focus();
  };

  const focusFilters = () => tabRefs.current[filter]?.focus();

  return (
    <div className="qv-notif" data-testid="notifications-inbox">
      <div className="qv-notif-head">
        <div className="qv-notif-titlebar">
          <div className="qv-notif-titles">
            <TitleAs className="qv-notif-title">Notifications</TitleAs>
            <DescriptionAs className="qv-notif-sub">{unreadSummary(unread)}</DescriptionAs>
          </div>
          <button
            type="button"
            className="qv-notif-markall"
            onClick={() => void handleMarkAllRead()}
            disabled={unread === 0 || marking}
            data-testid="mark-all-notifications-read"
          >
            Mark all read
          </button>
          {onClose && (
            <button
              type="button"
              className="qv-notif-close"
              onClick={onClose}
              aria-label="Close notifications"
            >
              <X className="size-5" strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="qv-seg qv-notif-filters" role="tablist" aria-label="Filter notifications">
          {NOTIFICATION_FILTERS.map((f, index) => (
            <button
              key={f.id}
              ref={(el) => {
                tabRefs.current[f.id] = el;
              }}
              type="button"
              role="tab"
              id={`notifications-tab-${f.id}`}
              aria-selected={filter === f.id}
              aria-controls="notifications-tabpanel"
              tabIndex={filter === f.id ? 0 : -1}
              onClick={() => setFilter(f.id)}
              onKeyDown={(e) => onTabKey(e, index)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div
        id="notifications-tabpanel"
        role="tabpanel"
        aria-labelledby={`notifications-tab-${filter}`}
        className="qv-notif-body"
      >
        {pending ? (
          <div className="qv-notif-list" aria-busy="true" data-testid="notifications-loading">
            <span className="sr-only">Loading notifications</span>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="qv-nrow qv-nrow-skeleton">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="qv-notif-empty">
            <p className="qv-notif-empty-title">We couldn&apos;t load your notifications.</p>
            <p className="qv-notif-empty-text">Check your connection and try again.</p>
            <button type="button" className="qv-notif-markall" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : (
          <NotificationLists
            notifications={shown}
            onNavigate={onNavigate}
            onListEmptied={focusFilters}
            emptyTitle={filter === "all" ? "You're all caught up!" : "Nothing here"}
            emptyDescription={EMPTY_TEXT[filter]}
          />
        )}
      </div>
    </div>
  );
}
