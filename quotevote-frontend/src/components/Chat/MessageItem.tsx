"use client";

import type { FC } from 'react';
import { useMemo, memo } from 'react';
import { useMutation } from '@apollo/client/react';
import { Check, CheckCheck, Trash2 } from 'lucide-react';

import Avatar from '@/components/Avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppStore } from '@/store';
import { toast } from 'sonner';
import { DELETE_MESSAGE } from '@/graphql/mutations';
import useGuestGuard from '@/hooks/useGuestGuard';
import type { MessageItemProps } from '@/types/chat';
import { cn } from '@/lib/utils';

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

const MessageItemComponent: FC<MessageItemProps> = ({ message }) => {
  const currentUser = useAppStore((state) => state.user.data);
  const ensureAuth = useGuestGuard();

  const currentUserId = currentUser?._id ? normalizeId(currentUser._id) : null;
  const isOwnMessage = currentUserId
    ? normalizeId(message.userId) === currentUserId
    : false;
  const isAdmin = currentUser?.admin === true;
  const canDelete = isOwnMessage || isAdmin;
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
    if (!ensureAuth()) return;
    try {
      await deleteMessage({ variables: { messageId: message._id } });
      toast.success('Message deleted successfully');
    } catch (err) {
      const errorMessage =
        err instanceof Error && err.message
          ? err.message
          : 'Failed to delete message';

      toast.error(`Delete Error: ${errorMessage}`);
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
        'mb-[14px] flex w-full px-2',
        isDefaultDirection ? 'justify-start' : 'justify-end'
      )}
    >
      {isDefaultDirection && (
        <div className="mr-2.5 flex h-10 w-10 flex-shrink-0 items-center justify-center">
          <Avatar
            src={avatarSrc}
            alt={senderName}
            size={40}
            fallback={senderName[0]?.toUpperCase() || '?'}
            className="ring-2 ring-white shadow-sm"
          />
        </div>
      )}

      <div className="flex min-w-[120px] max-w-[75%] flex-col">
        {isDefaultDirection && (
          <div className="mb-[3px] pl-1 text-[0.75rem] font-semibold text-muted-foreground">
            {senderName}
          </div>
        )}

        <div className="relative group">
          <div
            className={cn(
              'relative px-4 py-[10px] text-[0.9375rem] leading-[1.5] transition-shadow duration-200',
              isDefaultDirection
                ? 'rounded-[20px_20px_20px_6px] border border-gray-200 bg-white text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.10)]'
                : 'rounded-[20px_20px_6px_20px] bg-gradient-to-br from-[#52b274] to-[#4a9e63] text-white shadow-[0_4px_12px_rgba(82,178,116,0.35),0_2px_4px_rgba(82,178,116,0.20)] hover:shadow-[0_6px_16px_rgba(82,178,116,0.40),0_3px_6px_rgba(82,178,116,0.25)]'
            )}
          >
            <p className="whitespace-pre-wrap break-words">
              {message.text}
            </p>
          </div>

          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-500 shadow-[0_3px_10px_rgba(0,0,0,0.2)] opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-red-50 hover:scale-110 hover:shadow-[0_4px_14px_rgba(0,0,0,0.25)]"
              aria-label="Delete message"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div
          className={cn(
            'mt-1 flex items-center gap-1.5 text-[0.6875rem] font-medium text-muted-foreground',
            isOwnMessage ? 'justify-end pr-1' : 'justify-start pl-1'
          )}
        >
          {isOwnMessage && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center">
                    {readState.isRead ? (
                      <CheckCheck className="mr-0.5 h-3.5 w-3.5 text-[#52b274] drop-shadow-sm" />
                    ) : (
                      <Check className="mr-0.5 h-3 w-3 text-muted-foreground" />
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {readState.isRead ? 'Read' : 'Sent'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <span>{timeLabel}</span>
        </div>
      </div>

      {!isDefaultDirection && (
        <div className="ml-2.5 flex h-10 w-10 flex-shrink-0 items-center justify-center">
          <Avatar
            src={avatarSrc}
            alt={senderName}
            size={40}
            fallback={senderName[0]?.toUpperCase() || '?'}
            className="ring-2 ring-white shadow-sm"
          />
        </div>
      )}
    </div>
  );
};

const MessageItem = memo(MessageItemComponent);
export default MessageItem;
