"use client";

import { useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useApolloClient } from "@apollo/client/react";
import moment from "moment";
import { toast } from "sonner";
import { DisplayAvatar } from "@/components/DisplayAvatar";
import { DELETE_NOTIFICATION, MARK_NOTIFICATION_READ } from "@/graphql/mutations";
import { GET_NOTIFICATIONS } from "@/graphql/queries";
import { useAppStore } from "@/store";
import useGuestGuard from "@/hooks/useGuestGuard";
import { useHasMounted } from "@/hooks/useMediaQuery";
import { parseApiDate } from "@/lib/utils/apiDate";
import { toAppPostUrl } from "@/lib/utils/sanitizeUrl";
import type { Notification, NotificationListsProps } from "@/types/notification";

/** After × removes a row, focus the next/previous delete button or the filters. */
type PendingFocus = { kind: "delete"; id: string } | { kind: "empty" };

/** The interaction colour of each kind, as in the design (`--l-*`). */
const LIGHT: Record<Notification["notificationType"], string> = {
  UPVOTED: "up",
  DOWNVOTED: "down",
  COMMENTED: "comment",
  QUOTED: "quote",
  FOLLOW: "post",
};

const ACTION: Record<Notification["notificationType"], string> = {
  FOLLOW: "started following you",
  UPVOTED: "upvoted your post",
  DOWNVOTED: "downvoted your post",
  COMMENTED: "commented on your post",
  QUOTED: "quoted your post",
};

/** The design's 18px glyphs, one per kind. */
function KindIcon({ type }: { type: Notification["notificationType"] }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", "aria-hidden": true } as const;
  switch (type) {
    case "UPVOTED":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2.4}>
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      );
    case "DOWNVOTED":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2.4}>
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      );
    case "COMMENTED":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2.2}>
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
        </svg>
      );
    case "QUOTED":
      return (
        <svg {...common} fill="currentColor">
          <path d="M7 7h4v4c0 3-2 5-4 6l-1-1.5c1.4-.8 2.2-2 2.3-3.5H7zm8 0h4v4c0 3-2 5-4 6l-1-1.5c1.4-.8 2.2-2 2.3-3.5H15z" />
        </svg>
      );
    default:
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2.2}>
          <circle cx="9" cy="8" r="4" />
          <path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6" />
        </svg>
      );
  }
}

export function notificationDisplayName(userBy: Notification["userBy"]): string {
  return userBy?.name || userBy?.username || "Someone";
}

/** Votes show the post title; comments and quotes show what was written; follows nothing. */
export function notificationExcerpt(notification: Notification): string | null {
  switch (notification.notificationType) {
    case "UPVOTED":
    case "DOWNVOTED":
      return notification.post?.title || notification.label || null;
    case "COMMENTED":
    case "QUOTED":
      return notification.label || null;
    default:
      return null;
  }
}

/** "Today at 2:41 PM" (phones drop "Today at"), "Yesterday at 6:20 PM", older dates in full. */
function NotificationTime({ created }: { created: Date }) {
  const today = moment(created).isSame(moment(), "day");
  const time = moment(created).format("h:mm A");
  return (
    <time dateTime={created.toISOString()} className="qv-nrow-time" data-testid="notification-time">
      {today ? (
        <>
          <span className="qv-nrow-today">Today at </span>
          {time}
        </>
      ) : (
        moment(created).calendar(null, {
          lastDay: "[Yesterday at] h:mm A",
          lastWeek: "[Last] dddd [at] h:mm A",
          sameElse: "MMM D, YYYY [at] h:mm A",
        })
      )}
    </time>
  );
}

/** Splits rows into the design's Today and Earlier groups, newest first. */
export function groupByDay(
  notifications: Notification[]
): { label: string; rows: Notification[] }[] {
  const today: Notification[] = [];
  const earlier: Notification[] = [];
  for (const n of notifications) {
    const created = parseApiDate(n.created);
    (created && moment(created).isSame(moment(), "day") ? today : earlier).push(n);
  }
  return [
    { label: "Today", rows: today },
    { label: "Earlier", rows: earlier },
  ].filter((group) => group.rows.length > 0);
}

export function NotificationLists({
  notifications,
  onNavigate,
  onListEmptied,
  emptyTitle = "You're all caught up!",
  emptyDescription = "No alerts right now.",
}: NotificationListsProps) {
  const router = useRouter();
  const client = useApolloClient();
  const ensureAuth = useGuestGuard();
  const setSelectedPost = useAppStore((state) => state.setSelectedPost);
  // Times read in the viewer's time zone, which the server doesn't know (#605).
  const hasMounted = useHasMounted();
  const pendingFocusRef = useRef<PendingFocus | null>(null);
  const onListEmptiedRef = useRef(onListEmptied);

  const [removeNotification] = useMutation(DELETE_NOTIFICATION);
  const [markRead] = useMutation(MARK_NOTIFICATION_READ);

  useLayoutEffect(() => {
    onListEmptiedRef.current = onListEmptied;
  }, [onListEmptied]);

  // Keep keyboard focus in the list after × removes the focused button.
  useLayoutEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;
    pendingFocusRef.current = null;
    if (pending.kind === "empty") {
      onListEmptiedRef.current?.();
      return;
    }
    document.querySelector<HTMLElement>(`[data-delete-notification="${pending.id}"]`)?.focus();
  }, [notifications]);

  /** Rewrites the cached list, so the panel, the badge and Your discussions agree at once. */
  const updateCache = (update: (rows: Notification[]) => Notification[]) => {
    const cached = client.readQuery<{ notifications?: Notification[] }>({
      query: GET_NOTIFICATIONS,
    });
    if (!cached?.notifications) return;
    client.writeQuery({
      query: GET_NOTIFICATIONS,
      data: { notifications: update(cached.notifications) },
    });
  };

  const handleDelete = async (notificationId: string): Promise<void> => {
    if (!ensureAuth()) return;
    updateCache((rows) => rows.filter((n) => n._id !== notificationId));
    try {
      await removeNotification({
        variables: { notificationId },
        refetchQueries: [{ query: GET_NOTIFICATIONS }],
      });
    } catch {
      toast.error("Couldn't delete that notification. Please try again.");
    }
  };

  const handleDeleteWithFocus = (notificationId: string): void => {
    const index = notifications.findIndex((n) => n._id === notificationId);
    const focusId =
      notifications[index + 1]?._id ?? (index > 0 ? notifications[index - 1]?._id : undefined);
    pendingFocusRef.current = focusId ? { kind: "delete", id: focusId } : { kind: "empty" };
    void handleDelete(notificationId);
  };

  const navigateTo = (notification: Notification): boolean => {
    const { notificationType, userBy, post } = notification;
    if (notificationType === "FOLLOW") {
      if (!userBy?.username) return false;
      router.push(`/profile/${userBy.username}`);
      return true;
    }
    if (post?.deleted) {
      // The post page can't tell a deleted post from a bad link, so say which one it is.
      router.push(`${toAppPostUrl(post.url)}?deleted=1`);
      return true;
    }
    if (post) {
      setSelectedPost(post._id);
      router.push(toAppPostUrl(post.url));
      return true;
    }
    return false;
  };

  const handleOpen = (notification: Notification): void => {
    if (!ensureAuth()) return;
    if (!navigateTo(notification)) return;
    onNavigate?.();
    // Opening a notification reads it; it stays in the list.
    if (notification.status === "new") {
      updateCache((rows) =>
        rows.map((n) => (n._id === notification._id ? { ...n, status: "read" } : n))
      );
      void markRead({ variables: { notificationId: notification._id } }).catch(() => undefined);
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="qv-notif-empty" data-testid="notifications-empty">
        <p className="qv-notif-empty-title">{emptyTitle}</p>
        <p className="qv-notif-empty-text">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="qv-notif-list">
      {groupByDay(notifications).map((group) => (
        <section key={group.label} aria-label={group.label} className="qv-notif-group">
          <h3 className="qv-notif-day">{group.label}</h3>
          {group.rows.map((notification) => {
            const name = notificationDisplayName(notification.userBy);
            const excerpt = notificationExcerpt(notification);
            const created = parseApiDate(notification.created);
            const unread = notification.status === "new";
            return (
              <div
                key={notification._id}
                className="qv-nrow"
                data-light={LIGHT[notification.notificationType] ?? "post"}
                data-unread={unread || undefined}
                data-testid="notification-row"
              >
                <button
                  type="button"
                  className="qv-nrow-main"
                  onClick={() => handleOpen(notification)}
                >
                  <span className="qv-nrow-who">
                    <span className="qv-nrow-icon">
                      <KindIcon type={notification.notificationType} />
                    </span>
                    {notification.userBy && (
                      <span className="qv-nrow-avatar" aria-hidden="true">
                        <DisplayAvatar
                          avatar={notification.userBy.avatar}
                          username={notification.userBy.username}
                          size={24}
                        />
                      </span>
                    )}
                  </span>
                  <span className="qv-nrow-text">
                    <span className="qv-nrow-line">
                      {unread && <span className="sr-only">Unread: </span>}
                      <b>{name}</b> {ACTION[notification.notificationType] ?? ""}
                    </span>
                    {excerpt && <span className="qv-nrow-excerpt">&ldquo;{excerpt}&rdquo;</span>}
                    {notification.post?.deleted ? (
                      <span className="qv-nrow-deleted">This post has been deleted</span>
                    ) : (
                      created && hasMounted && <NotificationTime created={created} />
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  className="qv-nrow-del"
                  data-delete-notification={notification._id}
                  onClick={() => handleDeleteWithFocus(notification._id)}
                  aria-label={`Delete notification from ${name}`}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
