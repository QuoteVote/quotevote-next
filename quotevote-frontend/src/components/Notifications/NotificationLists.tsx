"use client";

import { useRouter } from "next/navigation";
import { useMutation, useApolloClient } from "@apollo/client/react";
import moment from "moment";
import { X, UserPlus, ArrowUp, ArrowDown, MessageSquare, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DELETE_NOTIFICATION } from "@/graphql/mutations";
import {
  GET_NOTIFICATION_HISTORY,
  GET_NOTIFICATIONS,
  NOTIFICATION_HISTORY_LIMIT,
} from "@/graphql/queries";
import { useAppStore } from "@/store";
import useGuestGuard from "@/hooks/useGuestGuard";
import { useHasMounted } from "@/hooks/useMediaQuery";
import { parseApiDate } from "@/lib/utils/apiDate";
import { toAppPostUrl } from "@/lib/utils/sanitizeUrl";
import type { Notification } from "@/types/notification";
import { cn } from "@/lib/utils";

function notificationDisplayName(userBy: Notification["userBy"]): string {
  return userBy?.name || userBy?.username || "Someone";
}

interface NotificationListsProps {
  notifications: Notification[];
  pageView?: boolean;
  /** Active list clears on open; history is read-only aside from navigation (#464). */
  mode?: "active" | "history";
  /** Called after a notification sends the user somewhere (e.g. to close the panel). */
  onNavigate?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

const getNotificationIcon = (notificationType: Notification["notificationType"]) => {
  switch (notificationType) {
    case "FOLLOW":
      return (
        <span className="flex items-center justify-center size-7 rounded-full bg-blue-100 dark:bg-blue-900/40 shadow-sm ring-1 ring-blue-200/50 dark:ring-blue-800/50">
          <UserPlus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        </span>
      );
    case "UPVOTED":
      return (
        <span className="flex items-center justify-center size-7 rounded-full bg-green-100 dark:bg-green-900/40 shadow-sm ring-1 ring-green-200/50 dark:ring-green-800/50">
          <ArrowUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        </span>
      );
    case "DOWNVOTED":
      return (
        <span className="flex items-center justify-center size-7 rounded-full bg-red-100 dark:bg-red-900/40 shadow-sm ring-1 ring-red-200/50 dark:ring-red-800/50">
          <ArrowDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
        </span>
      );
    case "COMMENTED":
      return (
        <span className="flex items-center justify-center size-7 rounded-full bg-purple-100 dark:bg-purple-900/40 shadow-sm ring-1 ring-purple-200/50 dark:ring-purple-800/50">
          <MessageSquare className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
        </span>
      );
    case "QUOTED":
      return (
        <span className="flex items-center justify-center size-7 rounded-full bg-amber-100 dark:bg-amber-900/40 shadow-sm ring-1 ring-amber-200/50 dark:ring-amber-800/50">
          <Quote className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        </span>
      );
    default:
      return null;
  }
};

const getNotificationActionText = (notificationType: Notification["notificationType"]): string => {
  switch (notificationType) {
    case "FOLLOW":
      return "started following you";
    case "UPVOTED":
      return "upvoted your post";
    case "DOWNVOTED":
      return "downvoted your post";
    case "COMMENTED":
      return "commented on your post";
    case "QUOTED":
      return "quoted your post";
    default:
      return "";
  }
};

const stringLimit = (str: string, limit: number): string => {
  if (str.length <= limit) return str;
  return `${str.slice(0, limit)}...`;
};

const formatTimeAgo = (created: Date): string => {
  return moment(created).calendar(null, {
    sameDay: "[Today at] h:mm A",
    lastDay: "[Yesterday at] h:mm A",
    lastWeek: "[Last] dddd [at] h:mm A",
    sameElse: "MMM D, YYYY [at] h:mm A",
  });
};

export function NotificationLists({
  notifications,
  pageView = false,
  mode = "active",
  onNavigate,
  emptyTitle = "You're all caught up!",
  emptyDescription = "No alerts right now.",
}: NotificationListsProps) {
  const router = useRouter();
  const client = useApolloClient();
  const ensureAuth = useGuestGuard();
  const setSelectedPost = useAppStore((state) => state.setSelectedPost);
  // Times read in the viewer's time zone, which the server doesn't know (#605).
  const hasMounted = useHasMounted();
  const isHistory = mode === "history";

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

    try {
      await removeNotification({
        variables: {
          notificationId,
        },
        refetchQueries: [
          { query: GET_NOTIFICATIONS },
          {
            query: GET_NOTIFICATION_HISTORY,
            variables: { limit: NOTIFICATION_HISTORY_LIMIT },
          },
        ],
      });
    } catch {
      toast.error("Couldn't clear that notification. Please try again.");
    }
  };

  const navigateToNotification = (
    notificationType: Notification["notificationType"],
    userBy: Notification["userBy"],
    post?: Notification["post"]
  ): boolean => {
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

  const handleNotificationClick = (notification: Notification): void => {
    if (!ensureAuth()) return;

    const navigated = navigateToNotification(
      notification.notificationType,
      notification.userBy,
      notification.post
    );
    if (!navigated) return;

    onNavigate?.();

    // Active items clear into history in the background (#464). History stays clickable only.
    if (!isHistory && notification.status !== "deleted") {
      void handleDelete(notification._id);
    }
  };

  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
        <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
        <p className="text-xs text-muted-foreground mt-1">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-auto",
        pageView ? "w-full" : "w-full max-w-sm",
        !pageView && notifications.length >= 5 && "max-h-[75vh]"
      )}
    >
      <div className="space-y-2">
        {notifications.map((notification) => {
          const actionText = getNotificationActionText(notification.notificationType);
          const icon = getNotificationIcon(notification.notificationType);
          const displayName = notificationDisplayName(notification.userBy);
          const created = parseApiDate(notification.created);

          return (
            <div
              key={notification._id}
              className={cn(
                "group flex items-start gap-1 rounded-lg border transition-colors",
                isHistory
                  ? "border-border/70 bg-muted/30 hover:bg-muted/50"
                  : "border-border bg-card hover:bg-accent/50"
              )}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-lg p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7a4c] dark:focus-visible:ring-[#7fdc9c]"
                onClick={() => handleNotificationClick(notification)}
              >
                {icon && (
                  <span className="flex-shrink-0 mt-0.5" aria-hidden>
                    {icon}
                  </span>
                )}

                <span className="block flex-1 min-w-0">
                  <span className="block text-sm text-foreground">
                    <span className="font-semibold">{displayName}</span>{" "}
                    <span className="text-muted-foreground">{actionText}</span>
                  </span>
                  {notification.notificationType !== "FOLLOW" && notification.label && (
                    <span className="block text-sm text-muted-foreground mt-1 truncate">
                      &ldquo;{stringLimit(notification.label, pageView ? 1000 : 50)}&rdquo;
                    </span>
                  )}
                  {notification.post?.deleted && (
                    <span className="block mt-1 text-xs font-medium text-muted-foreground">
                      This post has been deleted
                    </span>
                  )}
                  {isHistory && (
                    <span className="block mt-1 text-xs font-medium text-muted-foreground">
                      Cleared
                    </span>
                  )}
                  {created && (
                    <time
                      dateTime={created.toISOString()}
                      className="block min-h-4 text-xs text-muted-foreground mt-1"
                      data-testid="notification-time"
                    >
                      {hasMounted ? formatTimeAgo(created) : null}
                    </time>
                  )}
                </span>
              </button>

              {!isHistory && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mr-2 mt-3 size-8 flex-shrink-0 text-muted-foreground transition-opacity hover:text-foreground focus-visible:ring-[#2f7a4c] dark:focus-visible:ring-[#7fdc9c] [@media(hover:hover)]:opacity-0 group-hover:opacity-100! group-focus-within:opacity-100! focus-visible:opacity-100!"
                  onClick={() => void handleDelete(notification._id)}
                  aria-label={`Clear notification from ${displayName}`}
                >
                  <X className="w-4 h-4" aria-hidden />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
