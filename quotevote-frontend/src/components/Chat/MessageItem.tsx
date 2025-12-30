"use client";

import type { FC } from 'react';
import { useMemo } from 'react';
import { useMutation } from '@apollo/client/react';
import { Check, CheckCheck, Trash2 } from 'lucide-react';

import Avatar from '@/components/Avatar';
import { useAppStore } from '@/store';
import { DELETE_MESSAGE } from '@/graphql/mutations';
import type { ChatMessage } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ExtendedChatMessage extends ChatMessage {
  user?: {
    _id?: string;
    name?: string;
    username?: string;
    avatar?: string | null | undefined | Record<string, unknown>;
    [key: string]: unknown;
  };
  readBy?: Array<string | { toString(): string } | null | undefined>;
}

interface MessageItemProps {
  message: ExtendedChatMessage;
}

const normalizeId = (id: unknown): string | null => {
  if (!id) return null;
  if (typeof id === 'string') return id;
  const candidate = id as { toString?: () => string };
  if (typeof candidate.toString === 'function') {
    try {
      return candidate.toString();
    } catch {
      return null;
    }
  }
  return String(id);
};

const formatTime = (date?: string | number | Date): string => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const MessageItem: FC<MessageItemProps> = ({ message }) => {
  const currentUser = useAppStore((state) => state.user.data);
  const setSnackbar = useAppStore((state) => state.setSnackbar);

  const currentUserId = currentUser?._id ? normalizeId(currentUser._id) : null;
  const isOwnMessage = currentUserId
    ? normalizeId(message.userId) === currentUserId
    : false;
  const isDefaultDirection = !isOwnMessage;

  const [deleteMessage] = useMutation(DELETE_MESSAGE);

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
    try {
      await deleteMessage({ variables: { messageId: message._id } });
      setSnackbar({
        open: true,
        message: 'Message deleted successfully',
        type: 'success',
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error && err.message
          ? err.message
          : 'Failed to delete message';

      setSnackbar({
        open: true,
        message: `Delete Error: ${errorMessage}`,
        type: 'danger',
      });
    }
  };

  if (!currentUser) return null;

  const senderName =
    (message.user && (message.user.name || message.user.username)) ||
    message.userName ||
    'Unknown';

  const avatarSrc =
    typeof message.user?.avatar === 'string'
      ? message.user.avatar
      : undefined;

  const timeLabel = formatTime(message.created);

  return (
    <div
      className={cn(
        'mb-2 flex w-full px-2',
        isDefaultDirection ? 'justify-start' : 'justify-end'
      )}
    >
      {isDefaultDirection && (
        <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center">
          <Avatar
            src={avatarSrc}
            alt={senderName}
            size={40}
            fallback={senderName[0]?.toUpperCase() || '?'}
          />
        </div>
      )}

      <div className="flex min-w-[120px] max-w-[75%] flex-col">
        {isDefaultDirection && (
          <div className="mb-0.5 pl-1 text-[11px] font-semibold text-muted-foreground">
            {senderName}
          </div>
        )}

        <div className="relative group">
          <div
            className={cn(
              'relative rounded-2xl px-3 py-2 text-sm shadow-sm transition-all',
              isDefaultDirection
                ? 'border border-border bg-background text-foreground'
                : 'bg-emerald-500 text-white shadow-emerald-500/40'
            )}
          >
            <p className="whitespace-pre-wrap break-words text-[0.94rem] leading-relaxed">
              {message.text}
            </p>
          </div>

          {isOwnMessage && (
            <button
              type="button"
              onClick={handleDelete}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background text-red-500 shadow-md opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
              aria-label="Delete message"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-[10px] text-muted-foreground',
            isOwnMessage ? 'justify-end pr-1' : 'justify-start pl-1'
          )}
        >
          {isOwnMessage && (
            <span className="inline-flex items-center">
              {readState.isRead ? (
                <CheckCheck className="mr-0.5 h-3 w-3 text-emerald-500" />
              ) : (
                <Check className="mr-0.5 h-3 w-3 text-muted-foreground" />
              )}
            </span>
          )}
          <span>{timeLabel}</span>
        </div>
      </div>

      {!isDefaultDirection && (
        <div className="ml-3 flex h-10 w-10 flex-shrink-0 items-center justify-center">
          <Avatar
            src={avatarSrc}
            alt={senderName}
            size={40}
            fallback={senderName[0]?.toUpperCase() || '?'}
          />
        </div>
      )}
    </div>
  );
};

export default MessageItem;
