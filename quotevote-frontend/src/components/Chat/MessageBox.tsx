"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Ban, MoreHorizontal, UserX, X } from "lucide-react";
import { useQuery } from "@apollo/client/react";

import MessageSend from "./MessageSend";
import MessageItemList from "./MessageItemList";
import TypingIndicator from "./TypingIndicator";
import { useBuddyManagement } from "@/hooks/useBuddyManagement";
import { useUserBlock } from "@/hooks/useUserBlock";
import useGuestGuard from "@/hooks/useGuestGuard";
import { useAppStore } from "@/store";
import { toast } from "sonner";
import { GET_CHAT_ROOMS, GET_BUDDY_LIST } from "@/graphql/queries";
import { toAbsolutePostUrl } from "@/lib/utils/sanitizeUrl";
import { PRESENCE_LABEL, toPresenceStatus } from "@/lib/constants/presence";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatRoom, StagedChatRoom } from "@/types/chat";
import type { GetBuddyListData } from "@/types/buddylist";

interface HeaderProps {
  room: ChatRoom | null;
  stagedProfileUsername?: string | null;
}

function Header({ room, stagedProfileUsername }: HeaderProps) {
  const currentUser = useAppStore((state) => state.user.data);
  const setSelectedChatRoom = useAppStore((state) => state.setSelectedChatRoom);
  const setChatOpen = useAppStore((state) => state.setChatOpen);
  const presenceMap = useAppStore((state) => state.chat.presenceMap);

  const { removeBuddy } = useBuddyManagement();
  const { refetch: refetchChatRooms } = useQuery<{ messageRooms: ChatRoom[] }>(GET_CHAT_ROOMS, {
    fetchPolicy: "cache-and-network",
  });
  const { data: buddyListData } = useQuery<GetBuddyListData>(GET_BUDDY_LIST, {
    skip: !currentUser,
  });

  const title = room?.title ?? "Chat";
  const messageType = room?.messageType ?? "USER";
  const users = room?.users ?? [];

  const currentUserIdForHeader = currentUser?._id?.toString();
  const otherUserId =
    messageType === "USER" && users.length === 2 && currentUserIdForHeader
      ? (users
          .map((id) => {
            if (!id) return null;
            try {
              return id.toString();
            } catch {
              return null;
            }
          })
          .filter(Boolean)
          .find((id) => id !== currentUserIdForHeader) ?? null)
      : null;

  const otherUsernameFromBuddies = otherUserId
    ? (buddyListData?.getBuddyList.find((b) => b.user._id?.toString() === otherUserId)?.user
        .username ?? null)
    : null;
  const profileUsername =
    messageType === "USER" ? (stagedProfileUsername ?? otherUsernameFromBuddies ?? null) : null;
  const profileHref = profileUsername ? `/profile/${encodeURIComponent(profileUsername)}` : null;

  const { blockedByMe: isBlocked, block, unblock } = useUserBlock(otherUserId);

  const handleBack = () => {
    setSelectedChatRoom(null);
  };

  const handleBlockUser = async () => {
    if (!otherUserId) return;

    try {
      if (isBlocked) {
        await unblock();
        await refetchChatRooms();
        toast.success("User unblocked successfully");
      } else {
        await block();
        await refetchChatRooms();
        toast.success(
          "User blocked successfully. Chat history is preserved, but they cannot send new messages."
        );
      }
    } catch (error: unknown) {
      const message =
        (error as { message?: string })?.message ||
        `Failed to ${isBlocked ? "unblock" : "block"} user`;
      toast.error(message);
    }
  };

  const handleRemoveBuddy = async () => {
    if (!otherUserId) return;

    try {
      await removeBuddy(otherUserId);
      await refetchChatRooms();
      toast.success("Buddy removed successfully");
    } catch (error: unknown) {
      const message = (error as { message?: string })?.message || "Failed to remove buddy";
      toast.error(message);
    }
  };

  const isUserRoom = messageType === "USER";
  const showSettingsMenu = isUserRoom && !!otherUserId;
  // Same-app path only ('' origin), so a post discussion always has a way back to its post.
  const postPath = !isUserRoom ? toAbsolutePostUrl(room?.postDetails?.url, "") : null;

  const presence = otherUserId ? presenceMap[otherUserId]?.status : undefined;
  const subtitle = isUserRoom
    ? [
        otherUserId ? PRESENCE_LABEL[toPresenceStatus(presence ?? "offline")] : "Direct message",
        profileUsername ? `@${profileUsername}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : `${users.length} ${users.length === 1 ? "person" : "people"} · discussion`;

  return (
    <header className="qv-convo-head">
      <button
        type="button"
        onClick={handleBack}
        className="qv-msg-icon-btn qv-convo-back"
        aria-label="Back to conversations"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
      </button>

      <div className="qv-convo-titles">
        <b className="qv-convo-title">{title || "Chat"}</b>
        <span className="qv-convo-sub">{subtitle}</span>
      </div>

      {postPath ? (
        <Link
          href={postPath}
          onClick={() => setChatOpen(false)}
          data-testid="discussion-view-post"
          aria-label={`View post${title ? `: ${title}` : ""}`}
          className="qv-msg-btn-sm"
        >
          View post
        </Link>
      ) : profileHref ? (
        <Link
          href={profileHref}
          onClick={() => setChatOpen(false)}
          aria-label={`View ${profileUsername}'s profile`}
          className="qv-msg-btn-sm"
        >
          View profile
        </Link>
      ) : null}

      {showSettingsMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="qv-msg-icon-btn" aria-label="Chat settings">
              <MoreHorizontal className="size-5" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={handleBlockUser}
              className="text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-950/40"
            >
              <Ban className="mr-2 h-4 w-4" />
              <span>{isBlocked ? "Unblock User" : "Block User"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleRemoveBuddy}
              className="text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-950/40"
            >
              <UserX className="mr-2 h-4 w-4" />
              <span>Remove Buddy</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <button
        type="button"
        onClick={() => setChatOpen(false)}
        className="qv-msg-icon-btn qv-convo-close"
        aria-label="Close chat"
      >
        <X className="size-5" aria-hidden="true" />
      </button>
    </header>
  );
}

interface MessageBoxProps {
  roomOverride?: ChatRoom | null;
}

function MessageBox({ roomOverride }: MessageBoxProps) {
  const ensureAuth = useGuestGuard();
  const selectedRoomId = useAppStore((state) => state.chat.selectedRoom);
  const isStagedRoom = selectedRoomId !== null && typeof selectedRoomId === "object";
  const stagedProfileUsername = isStagedRoom
    ? ((selectedRoomId as StagedChatRoom).username ?? null)
    : null;
  // A staged room doesn't exist yet, so the first message names the other member and the
  // backend creates the room (#713). MessageSend then selects the room by its real id.
  const stagedRecipientId = isStagedRoom ? (selectedRoomId as StagedChatRoom).recipientId : null;

  const { data: roomsData } = useQuery<{ messageRooms: ChatRoom[] }>(GET_CHAT_ROOMS, {
    fetchPolicy: "cache-and-network",
    skip: isStagedRoom,
  });

  const room: ChatRoom | null = (() => {
    if (roomOverride) return roomOverride;
    if (isStagedRoom) {
      const staged = selectedRoomId as StagedChatRoom;
      return {
        // Empty string as sentinel — MessageSend treats falsy messageRoomId as "create new room"
        _id: "",
        title: staged.title,
        avatar: staged.avatar,
        messageType: staged.messageType,
        users: staged.users,
        created: new Date().toISOString(),
      };
    }
    return typeof selectedRoomId === "string"
      ? (roomsData?.messageRooms.find((r) => r._id === selectedRoomId) ?? null)
      : null;
  })();

  const messageRoomId = room?._id ?? null;
  const messageType = room?.messageType ?? "USER";
  const title = room?.title ?? null;

  // Track auth requirement for read-related behaviour (currently only used to gate child components)
  const hasAuthRef = useRef(false);
  useEffect(() => {
    hasAuthRef.current = ensureAuth();
  }, [ensureAuth]);

  if (!room) {
    return (
      <div className="flex h-full items-center justify-center px-5 py-4 text-center text-sm text-muted-foreground">
        No room selected
      </div>
    );
  }

  return (
    <div className="qv-convo">
      <Header room={room} stagedProfileUsername={stagedProfileUsername} />
      <div className="qv-convo-body">
        <MessageItemList room={room} />
        {messageRoomId && <TypingIndicator messageRoomId={messageRoomId} />}
      </div>
      <div className="qv-convo-compose">
        <MessageSend
          messageRoomId={messageRoomId}
          type={messageType ?? "USER"}
          title={title}
          componentId={stagedRecipientId}
        />
      </div>
    </div>
  );
}

export default MessageBox;
