"use client";

import { useState, useMemo, KeyboardEvent, ChangeEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { Send, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';
import { toast } from 'sonner';
import { GET_CHAT_ROOMS, GET_ROOM_MESSAGES, GET_ROSTER } from '@/graphql/queries';
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
  const setChatSubmitting = useAppStore((state) => state.setChatSubmitting);
  const setSelectedChatRoom = useAppStore((state) => state.setSelectedChatRoom);
  const selectedRoom = useAppStore((state) => state.chat.selectedRoom) as
    | SelectedRoomState
    | string
    | null;
  const ensureAuth = useGuestGuard();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Check if current user is blocked (only for USER type rooms)
  const { data: rosterData } = useQuery<{ getRoster: Array<{ _id: string; userId: string; buddyId: string; status: string; initiatedBy: string }> }>(GET_ROSTER, {
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
      !rosterData?.getRoster ||
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
    const rosterEntries = rosterData.getRoster;

    // Current user blocked other user if there is a roster entry where
    // current user initiated a 'blocked' status against the other user
    const currentUserBlockedOther = rosterEntries.some((r) => {
      return (
        r.status === 'blocked' &&
        r.userId?.toString() === currentUserId &&
        r.buddyId?.toString() === otherUserId
      );
    });

    // Other user blocked current user
    const otherUserBlockedCurrent = rosterEntries.some((r) => {
      return (
        r.status === 'blocked' &&
        r.userId?.toString() === otherUserId &&
        r.buddyId?.toString() === currentUserId
      );
    });

    if (currentUserBlockedOther) return 'blocker';
    if (otherUserBlockedCurrent) return 'blocked';
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chatUser._id is covered by user (same reference)
  }, [type, normalizedSelectedRoom, rosterData, user]);

  const isBlocked = blockingStatus !== null;

  // Typing indicator - only if room exists
  const { handleTyping, stopTyping } = useTypingIndicator(
    messageRoomId || ''
  );

  const [createMessage, { loading }] = useMutation<{ createMessage?: { __typename?: string; _id?: string; messageRoomId?: string; userName?: string; userId?: string; title?: string | null; text?: string; type?: string; created?: string; readBy?: unknown[]; user?: { __typename?: string; _id?: string; name?: string; username?: string; avatar?: string } } }>(SEND_MESSAGE, {
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

        toast(message);
      } else {
        toast.error(errorMessage);
      }
      setChatSubmitting(false);
      setIsSending(false);
    },
    onCompleted: (data) => {
      setChatSubmitting(false);
      setIsSending(false);
      setError(null);

      if (!messageRoomId && data?.createMessage?.messageRoomId) {
        setSelectedChatRoom(data.createMessage.messageRoomId);
      }
    },
    update: (cache, { data: mutationData }) => {
      if (!messageRoomId || !mutationData?.createMessage) return;

      const existingData = cache.readQuery<{ messages: Array<{ _id: string; messageRoomId: string; userId: string; userName: string; title: string; text: string; created: string; type: string; user?: { _id?: string; name?: string; username?: string; avatar?: string } }> }>({
        query: GET_ROOM_MESSAGES,
        variables: { messageRoomId },
      });

      if (existingData) {
        const alreadyExists = existingData.messages.some(
          (m) => m._id === mutationData.createMessage?._id
        );
        if (!alreadyExists) {
          cache.writeQuery({
            query: GET_ROOM_MESSAGES,
            variables: { messageRoomId },
            data: {
              ...existingData,
              messages: [...existingData.messages, mutationData.createMessage],
            },
          });
        }
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

      toast(message);
      return;
    }

    stopTyping();
    setChatSubmitting(true);
    setIsSending(true);

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
            readBy: [],
            user: {
              __typename: 'User',
              _id: chatUser?._id,
              name: chatUser?.name,
              username: chatUser?.username,
              avatar: chatUser?.avatar,
            },
          },
        },
      });
    } catch (err) {
      console.error('Error creating message:', err);
      setIsSending(false);
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
          'flex items-end rounded-[28px] border-2 border-gray-300 bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300',
          'focus-within:border-[#52b274] focus-within:-translate-y-px focus-within:shadow-[0_0_0_3px_rgba(82,178,116,0.25),0_4px_16px_rgba(82,178,116,0.15)]',
          isSending && 'opacity-70'
        )}
      >
        <textarea
          aria-label="message input"
          className="min-h-[40px] max-h-[140px] flex-1 resize-none border-0 bg-transparent p-0 text-[0.9375rem] leading-[1.5] outline-none focus:outline-none focus-visible:outline-none placeholder:text-muted-foreground"
          placeholder={placeholder}
          value={text}
          disabled={isBlocked || isSending}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <Button
          type="button"
          size="icon"
          className="ml-2 h-9 w-9 flex-shrink-0 rounded-full bg-[#52b274] text-white shadow-[0_2px_8px_rgba(82,178,116,0.30)] transition-all duration-200 hover:bg-[#4a9e63] hover:scale-[1.08] hover:shadow-[0_4px_12px_rgba(82,178,116,0.40)] active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
          aria-label={isSending ? 'Sending message' : 'Send message'}
          disabled={loading || !text.trim() || isBlocked || isSending}
          onClick={() => void handleSubmit()}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
