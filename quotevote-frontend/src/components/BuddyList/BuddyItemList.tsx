"use client";

import { useLazyQuery } from "@apollo/client/react";
import { useAppStore } from "@/store";
import { GET_CHAT_ROOM } from "@/graphql/queries";
import { PRESENCE_LABEL, toPresenceStatus } from "@/lib/constants/presence";
import { DisplayAvatar } from "@/components/DisplayAvatar";
import { BuddyItem, BuddyItemListProps } from "@/types/buddylist";
import { ChatRoom, StagedChatRoom } from "@/types/chat";

export default function BuddyItemList({ buddyList, className }: BuddyItemListProps) {
  const currentUser = useAppStore((state) => state.user.data);
  const setSelectedChatRoom = useAppStore((state) => state.setSelectedChatRoom);
  const [getChatRoom] = useLazyQuery<{ messageRoom: ChatRoom }>(GET_CHAT_ROOM);

  const itemList = buddyList ?? [];

  const handleClickItem = async (item: BuddyItem) => {
    if (!currentUser || !currentUser._id) return;

    // 1. If item has a room object
    if (item.room && item.room._id) {
      setSelectedChatRoom(item.room._id);
      return;
    }

    // 2. If item is a specific room from messageRooms (mapped in index.jsx has .room)
    // But sometimes item IS the room (if mapped differently?).
    // In index.jsx: map(item => ({ room: item ... })). So item.room is consistent.

    // 3. If item has a user (BuddyListWithPresence) but no room yet
    if (item.user && item.user._id) {
      try {
        // Attempt to find existing room
        const { data } = await getChatRoom({
          variables: { otherUserId: item.user._id },
        });

        if (data && data.messageRoom && data.messageRoom._id) {
          setSelectedChatRoom(data.messageRoom._id);
        } else {
          // No room yet — stage a new DM so MessageBox renders the compose view
          const staged: StagedChatRoom = {
            _id: null,
            title: item.user.name || item.user.username || "Chat",
            avatar:
              (item.user.avatar as string | Record<string, unknown> | null | undefined) ?? null,
            messageType: "USER",
            users: [currentUser._id!.toString(), item.user._id],
            recipientId: item.user._id,
            username: item.user.username,
          };
          setSelectedChatRoom(staged);
        }
      } catch {
        // Handle error silently or via toast
      }
    }
  };

  return (
    <ul className={["qv-buddy-list", className].filter(Boolean).join(" ")}>
      {itemList.map((item, index) => {
        if (!item) return null;
        // Key generation logic
        const itemKey = item.room?._id || item.user?._id || item._id || `item-${index}`;
        return <BuddyItemRow key={itemKey} item={item} onClick={() => handleClickItem(item)} />;
      })}
    </ul>
  );
}

function BuddyItemRow({ item, onClick }: { item: BuddyItem; onClick: () => void }) {
  const itemText =
    item.Text || item.user?.name || item.user?.username || item.room?.title || "Unknown";

  const rawAvatar = item.avatar || item.user?.avatar || item.room?.avatar;

  const status = toPresenceStatus((item.presence?.status as string) || "offline");
  const lastSeen = (item.presence as { lastSeen?: string | null } | undefined)?.lastSeen;
  const detail =
    status === "offline"
      ? lastSeen
        ? `Offline · last seen ${timeAgo(lastSeen)}`
        : "Offline"
      : `${PRESENCE_LABEL[status]}${item.statusMessage ? ` · ${item.statusMessage}` : ""}`;

  return (
    <li className="qv-buddy">
      <button type="button" className="qv-buddy-main" onClick={onClick}>
        <span className="qv-room-avatar">
          <DisplayAvatar
            avatar={rawAvatar as string | Record<string, unknown> | undefined}
            username={itemText}
            size={44}
          />
          <span className="qv-presence-dot" data-status={status} aria-hidden="true" />
        </span>
        <span className="qv-room-text">
          <span className="qv-room-name">{itemText}</span>
          <span className="qv-room-preview">{detail}</span>
        </span>
        {item.unreadMessages && item.unreadMessages > 0 ? (
          <span className="qv-room-unread">
            {item.unreadMessages > 99 ? "99+" : item.unreadMessages}
            <span className="sr-only"> unread</span>
          </span>
        ) : null}
      </button>
    </li>
  );
}

/** "2h ago", "3d ago": how long ago a buddy was last seen. */
function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (Number.isNaN(minutes)) return "a while ago";
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
