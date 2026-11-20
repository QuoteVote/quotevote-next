"use client";

import type { FC } from "react";
import { useMemo, memo } from "react";
import Link from "next/link";
import { useMutation } from "@apollo/client/react";
import { Check, CheckCheck, Trash2 } from "lucide-react";

import { DisplayAvatar } from "@/components/DisplayAvatar";
import { useAppStore } from "@/store";
import { toast } from "sonner";
import { DELETE_MESSAGE } from "@/graphql/mutations";
import useGuestGuard from "@/hooks/useGuestGuard";
import type { MessageItemProps } from "@/types/chat";

const normalizeId = (id: unknown): string | null => {
  if (!id) return null;
  if (typeof id === "string") return id;
  const candidate = id as { toString?: () => string };
  if (typeof candidate.toString === "function") {
    try {
      return candidate.toString();
    } catch {
      return null;
    }
  }
  return String(id);
};

const formatTime = (date?: string | number | Date): string => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MessageItemComponent: FC<MessageItemProps> = ({ message, roomType }) => {
  const currentUser = useAppStore((state) => state.user.data);
  const ensureAuth = useGuestGuard();

  const currentUserId = currentUser?._id ? normalizeId(currentUser._id) : null;
  const isOwnMessage = currentUserId ? normalizeId(message.userId) === currentUserId : false;
  const isDeleted = message.deleted === true;
  // Direct messages can't be deleted (#576); in a post's chat, only by their author.
  const canDelete = roomType === "POST" && isOwnMessage && !isDeleted;
  const isDefaultDirection = !isOwnMessage;

  // Refetch rather than drop the message: the room shows a note in its place.
  const [deleteMessage] = useMutation(DELETE_MESSAGE, {
    refetchQueries: ["getRoomMessages"],
  });

  const readState = useMemo(() => {
    const readByRaw = message.readBy ?? [];
    const normalizedReadBy = readByRaw
      .map((id) => normalizeId(id))
      .filter((id): id is string => Boolean(id));

    const isRead = normalizedReadBy.length > 0;

    return { isRead };
  }, [message.readBy]);

  const handleDelete = async () => {
    if (!message._id) return;
    if (!ensureAuth()) return;
    try {
      await deleteMessage({ variables: { messageId: message._id } });
      toast.success("Message deleted successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error && err.message ? err.message : "Failed to delete message";

      toast.error(`Delete Error: ${errorMessage}`);
    }
  };

  if (!currentUser) return null;

  const senderName =
    (message.user && (message.user.name || message.user.username)) || message.userName || "Unknown";

  const avatarRaw = message.user?.avatar;
  const profileUsername = message.user?.username ?? (isOwnMessage ? currentUser.username : null);
  const profileHref = profileUsername ? `/profile/${encodeURIComponent(profileUsername)}` : null;

  const timeLabel = formatTime(message.created);

  const avatarNode = (
    <DisplayAvatar
      avatar={avatarRaw as string | Record<string, unknown> | undefined}
      username={senderName}
      size={32}
    />
  );

  const avatarWithLink = profileHref ? (
    <Link
      href={profileHref}
      aria-label={`Open ${profileUsername} profile`}
      className="qv-bubble-avatar-link"
    >
      {avatarNode}
    </Link>
  ) : (
    avatarNode
  );

  // Sender names show in discussions, in a steady colour per person (design).
  const nameTone = (message.userId ?? senderName).length % 5;

  return (
    <div
      className="qv-bubble-row"
      data-mine={isOwnMessage || undefined}
      data-testid={`message-item-${message._id}`}
    >
      {isDefaultDirection && <div className="qv-bubble-avatar">{avatarWithLink}</div>}

      <div className="qv-bubble-col">
        <div className="qv-bubble-wrap group">
          <div className="qv-bubble" data-deleted={isDeleted || undefined}>
            {isDefaultDirection && roomType === "POST" && (
              <b className="qv-bubble-name" data-tone={nameTone}>
                {senderName}
              </b>
            )}
            <p>{message.text}</p>
          </div>

          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="qv-bubble-delete"
              aria-label="Delete message"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {isOwnMessage && (
          <div className="qv-bubble-meta">
            <span>{timeLabel}</span>
            <span
              className="qv-bubble-read"
              aria-label={readState.isRead ? "Read" : "Sent"}
              role="img"
            >
              {readState.isRead ? (
                <CheckCheck className="size-3.5" aria-hidden="true" />
              ) : (
                <Check className="size-3.5" aria-hidden="true" />
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const MessageItem = memo(MessageItemComponent);
export default MessageItem;
