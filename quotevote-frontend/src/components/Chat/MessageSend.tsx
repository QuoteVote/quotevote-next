"use client";

import { useState, useMemo, KeyboardEvent, ChangeEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { Send } from 'lucide-react';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';
import { GET_CHAT_ROOMS, GET_ROSTER } from '@/graphql/queries';
import { SEND_MESSAGE } from '@/graphql/mutations';
import useGuestGuard from '@/hooks/useGuestGuard';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { cn } from '@/lib/utils';
import type { MessageSendProps, ChatUser, SelectedRoomState } from '@/types/chat';

export default function MessageSend({
  messageRoomId,
  type,
  title,
  componentId,
}: MessageSendProps) {
  const user = useAppStore((state) => state.user.data);
  const chatUser = user as ChatUser | undefined;
  const setSnackbar = useAppStore((state) => state.setSnackbar);
  const setChatSubmitting = useAppStore((state) => state.setChatSubmitting);
  const selectedRoom = useAppStore((state) => state.chat.selectedRoom) as
    | SelectedRoomState
    | string
    | null;
  const ensureAuth = useGuestGuard();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Check if current user is blocked (only for USER type rooms)
  const { data: rosterData } = useQuery<{ roster: { buddies?: Array<{ id?: string; buddyId?: string; status?: string }>; blockedUsers?: Array<{ id?: string; username?: string }> } }>(GET_ROSTER, {
    skip: !user || type !== 'USER' || !selectedRoom,
  });

  // Determine blocking status: who blocked whom
  const normalizedSelectedRoom =
    typeof selectedRoom === 'string' || !selectedRoom
      ? null
      : selectedRoom.room || selectedRoom;

  const blockingStatus = useMemo(() => {
    if (
      type !== 'USER' ||
      !normalizedSelectedRoom ||
      !rosterData?.roster ||
      !chatUser?._id
    )
      return null;

    const users = normalizedSelectedRoom.users;
    const otherUserId = users?.find(
      (id: string | { toString(): string }) =>
        id?.toString() !== chatUser._id?.toString()
    )?.toString();

    if (!otherUserId) return null;

    const currentUserId = chatUser._id.toString();

    const { buddies = [], blockedUsers = [] } = rosterData.roster as {
      buddies?: Array<{
        id?: string;
        buddyId?: string;
        status?: string;
      }>;
      blockedUsers?: Array<{
        id?: string;
        username?: string;
      }>;
    };

    // Current user blocked other user if there is a buddy entry with status === 'blocked'
    const currentUserBlockedOther = buddies.some((r) => {
      const rUserId = currentUserId;
      const rBuddyId = r.buddyId?.toString();
      return rUserId === currentUserId && rBuddyId === otherUserId && r.status === 'blocked';
    });

    // Other user blocked current user if they appear in blockedUsers
    const otherUserBlockedCurrent = blockedUsers.some((r) => {
      const rUserId = r.id?.toString();
      return rUserId === otherUserId;
    });

    if (currentUserBlockedOther) return 'blocker';
    if (otherUserBlockedCurrent) return 'blocked';
    return null;
  }, [type, normalizedSelectedRoom, rosterData, user]);

  const isBlocked = blockingStatus !== null;

  // Typing indicator - only if room exists
  const { handleTyping, stopTyping } = useTypingIndicator(
    messageRoomId || ''
  );

  const [createMessage, { loading }] = useMutation<{ createMessage?: { __typename?: string; _id?: string; messageRoomId?: string; userName?: string; userId?: string; title?: string | null; text?: string; type?: string; created?: string } }>(SEND_MESSAGE, {
    onError: (err) => {
      // Check if error is due to blocking
      const errorMessage = err.message || 'Failed to send message';
      if (
        errorMessage.includes('blocked') ||
        errorMessage.includes('Cannot send message')
      ) {
        const isBlocker = blockingStatus === 'blocker';
        const message = isBlocker
          ? 'You have blocked this user. You cannot send messages to them.'
          : 'You have been blocked by this user. You cannot send messages.';

        setSnackbar({
          open: true,
          message,
          type: 'warning',
        });
      } else {
        setSnackbar({
          open: true,
          message: errorMessage,
          type: 'danger',
        });
      }
      setChatSubmitting(false);
    },
    onCompleted: (data) => {
      setChatSubmitting(false);
      setError(null);

      if (!messageRoomId && data?.createMessage?.messageRoomId) {
        // New room will be picked up via GET_CHAT_ROOMS refetch
      }
    },
    refetchQueries: [
      {
        query: GET_CHAT_ROOMS,
      },
    ],
  });

  const handleSubmit = async () => {
    if (!ensureAuth()) return;
    if (!text.trim()) return;

    if (isBlocked) {
      const isBlocker = blockingStatus === 'blocker';
      const message = isBlocker
        ? 'You have blocked this user. You cannot send messages to them.'
        : 'You have been blocked by this user. You cannot send messages.';

      setSnackbar({
        open: true,
        message,
        type: 'warning',
      });
      return;
    }

    stopTyping();
    setChatSubmitting(true);

    const payload = {
      title: title || null,
      type,
      messageRoomId: messageRoomId || null,
      componentId: componentId || null,
      text: text.trim(),
    };

    const dateSubmitted = new Date();
    try {
      await createMessage({
        variables: { message: payload },
        optimisticResponse: {
          createMessage: {
            __typename: 'Message',
            _id: dateSubmitted.toISOString(),
            messageRoomId: messageRoomId || undefined,
            userName: chatUser?.name,
            userId: chatUser?._id,
            title,
            text: text.trim(),
            type,
            created: dateSubmitted.toISOString(),
          },
        },
      });
    } catch (err) {
      console.error('Error creating message:', err);
      return;
    }

    setText('');
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (isBlocked) return;
    const value = event.target.value;
    setText(value);
    if (value.length > 0) {
      handleTyping();
    } else {
      stopTyping();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isBlocked) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  const placeholder = isBlocked
    ? blockingStatus === 'blocker'
      ? 'You have blocked this user'
      : 'You cannot send messages to this user'
    : 'Type a message...';

  return (
    <div className="flex flex-col gap-1">
      {error && (
        <p className="w-full text-xs text-red-500">{error}</p>
      )}
      <div
        className={cn(
          'flex items-end rounded-2xl border border-border bg-background/80 px-3 py-2 shadow-sm transition-colors',
          'focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/30'
        )}
      >
        <Textarea
          aria-label="message input"
          className="min-h-[40px] max-h-[140px] flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
          placeholder={placeholder}
          value={text}
          disabled={isBlocked}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <Button
          type="button"
          size="icon"
          className="ml-2 h-9 w-9 rounded-full bg-emerald-500 text-white shadow-md hover:bg-emerald-600 disabled:opacity-50"
          aria-label="Send message"
          disabled={loading || !text.trim() || isBlocked}
          onClick={() => void handleSubmit()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
