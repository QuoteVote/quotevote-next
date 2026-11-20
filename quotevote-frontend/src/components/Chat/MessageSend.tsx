"use client";

import { useState, KeyboardEvent, ChangeEvent } from "react";
import { useMutation } from "@apollo/client/react";
import { ArrowRight, Loader2 } from "lucide-react";

import { useAppStore } from "@/store";
import { toast } from "sonner";
import { GET_CHAT_ROOMS, GET_ROOM_MESSAGES } from "@/graphql/queries";
import { SEND_MESSAGE } from "@/graphql/mutations";
import useGuestGuard from "@/hooks/useGuestGuard";
import { useUserBlock } from "@/hooks/useUserBlock";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import type { MessageSendProps, ChatUser, SelectedRoomState } from "@/types/chat";

export default function MessageSend({ messageRoomId, type, title, componentId }: MessageSendProps) {
  const user = useAppStore((state) => state.user.data);
  const chatUser = user as ChatUser | undefined;
  const setChatSubmitting = useAppStore((state) => state.setChatSubmitting);
  const setSelectedChatRoom = useAppStore((state) => state.setSelectedChatRoom);
  const selectedRoom = useAppStore((state) => state.chat.selectedRoom) as
    | SelectedRoomState
    | string
    | null;
  const ensureAuth = useGuestGuard();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Determine blocking status: who blocked whom (only for USER type rooms)
  const normalizedSelectedRoom =
    typeof selectedRoom === "string" || !selectedRoom ? null : selectedRoom.room || selectedRoom;

  const otherUserId =
    type === "USER" && normalizedSelectedRoom && chatUser?._id
      ? normalizedSelectedRoom.users
          ?.find(
            (id: string | { toString(): string }) => id?.toString() !== chatUser._id?.toString()
          )
          ?.toString()
      : undefined;

  const { blockedByMe, blockedMe } = useUserBlock(otherUserId);
  const blockingStatus = blockedByMe ? "blocker" : blockedMe ? "blocked" : null;

  const isBlocked = blockingStatus !== null;

  // Typing indicator - only if room exists
  const { handleTyping, stopTyping } = useTypingIndicator(messageRoomId || "");

  const [createMessage, { loading }] = useMutation<{
    createMessage?: {
      __typename?: string;
      _id?: string;
      messageRoomId?: string;
      userName?: string;
      userId?: string;
      title?: string | null;
      text?: string;
      type?: string;
      created?: string;
      deleted?: boolean | null;
      readBy?: unknown[];
      user?: {
        __typename?: string;
        _id?: string;
        name?: string;
        username?: string;
        avatar?: string;
      };
    };
  }>(SEND_MESSAGE, {
    onError: (err) => {
      // Check if error is due to blocking
      const errorMessage = err.message || "Failed to send message";
      if (errorMessage.includes("blocked") || errorMessage.includes("Cannot send message")) {
        const isBlocker = blockingStatus === "blocker";
        const message = isBlocker
          ? "You have blocked this user. You cannot send messages to them."
          : "You have been blocked by this user. You cannot send messages.";

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

      const existingData = cache.readQuery<{
        messages: Array<{
          _id: string;
          messageRoomId: string;
          userId: string;
          userName: string;
          title: string;
          text: string;
          created: string;
          type: string;
          user?: { _id?: string; name?: string; username?: string; avatar?: string };
        }>;
      }>({
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
      const isBlocker = blockingStatus === "blocker";
      const message = isBlocker
        ? "You have blocked this user. You cannot send messages to them."
        : "You have been blocked by this user. You cannot send messages.";

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
            __typename: "Message",
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
              __typename: "User",
              _id: chatUser?._id,
              name: chatUser?.name,
              username: chatUser?.username,
              avatar: chatUser?.avatar,
            },
          },
        },
      });
    } catch (err) {
      console.error("Error creating message:", err);
      setIsSending(false);
      return;
    }

    setText("");
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
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  const placeholder = isBlocked
    ? blockingStatus === "blocker"
      ? "You have blocked this user"
      : "You cannot send messages to this user"
    : "Type a message...";

  return (
    <div className="qv-compose-msg" data-testid="message-send">
      {error && <p className="qv-compose-msg-error">{error}</p>}
      <div className="qv-compose-msg-row" data-busy={isSending || undefined}>
        <textarea
          aria-label="message input"
          className="qv-compose-msg-input"
          placeholder={placeholder}
          value={text}
          disabled={isBlocked || isSending}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          type="button"
          className="qv-compose-msg-send"
          aria-label={isSending ? "Sending message" : "Send message"}
          disabled={loading || !text.trim() || isBlocked || isSending}
          onClick={() => void handleSubmit()}
        >
          {isSending ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight className="size-5" strokeWidth={2.4} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
