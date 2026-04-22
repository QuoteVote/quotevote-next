"use client";

import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client/react';
import { toast } from 'sonner';

import ChatContent from './ChatContent';
import { MobileDrawer } from '@/components/Notifications/MobileDrawer';
import { useAppStore } from '@/store';
import { GET_CHAT_ROOMS } from '@/graphql/queries';
import type { ChatRoom } from '@/types/chat';

interface ChatMenuProps {
  fontSize?: 'small' | 'large' | string | number;
}

const ChatMenu: FC<ChatMenuProps> = ({ fontSize = 'medium' }) => {
  const open = useAppStore((state) => state.chat.open);
  const setChatOpen = useAppStore((state) => state.setChatOpen);
  const selectedRoom = useAppStore((state) => state.chat.selectedRoom);
  const setSelectedChatRoom = useAppStore((state) => state.setSelectedChatRoom);
  const isLoggedIn = useAppStore(
    (state) => !!(state.user.data?._id || (state.user.data as Record<string, unknown>)?.id)
  );
  const [isHovered, setIsHovered] = useState(false);

  const toggleOpen = () => setChatOpen(!open);

  const width = fontSize === 'large' ? 49 : 32;
  const height = fontSize === 'large' ? 46 : 30;

  // ── Unread count ──────────────────────────────────────────────────────────
  const { data: roomsData } = useQuery<{ messageRooms: ChatRoom[] }>(GET_CHAT_ROOMS, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 8000,
    skip: !isLoggedIn,
  });

  const totalUnread =
    roomsData?.messageRooms?.reduce((sum, r) => sum + (r.unreadMessages ?? 0), 0) ?? 0;

  // ── New-message toast notifications ──────────────────────────────────────
  const prevUnreadMapRef = useRef<Record<string, number>>({});
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!roomsData?.messageRooms) return;

    // Build current snapshot
    const current: Record<string, number> = {};
    for (const room of roomsData.messageRooms) {
      if (room._id) current[room._id] = room.unreadMessages ?? 0;
    }

    // Skip the very first load — we don't want to fire for messages that were
    // already unread before this session started.
    if (isFirstLoadRef.current) {
      prevUnreadMapRef.current = current;
      isFirstLoadRef.current = false;
      return;
    }

    const selectedRoomId =
      typeof selectedRoom === 'string' ? selectedRoom : null;

    for (const room of roomsData.messageRooms) {
      if (!room._id) continue;
      const prev = prevUnreadMapRef.current[room._id] ?? 0;
      const curr = current[room._id] ?? 0;

      // New unread message arrived in a room that isn't currently being viewed
      if (curr > prev && !(open && room._id === selectedRoomId)) {
        const senderLabel = room.title ?? 'New message';
        toast(`💬 ${senderLabel}`, {
          description: 'You have a new direct message',
          duration: 5000,
          action: {
            label: 'Open',
            onClick: () => {
              setChatOpen(true);
              if (room._id) setSelectedChatRoom(room._id);
            },
          },
        });
      }
    }

    prevUnreadMapRef.current = current;
  }, [roomsData, selectedRoom, open, setChatOpen, setSelectedChatRoom]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <button
        type="button"
        aria-label="Chat"
        onClick={toggleOpen}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative inline-flex items-center justify-center rounded-full border border-transparent bg-background/80 p-1.5 text-muted-foreground shadow-sm transition-colors hover:border-[#52b274]/60 hover:bg-[#52b274]/8 dark:hover:border-[#52b274]/40 dark:hover:bg-[#52b274]/15"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/ChatActive.svg"
          alt="Chat"
          style={{ width, height }}
          className={isHovered || open ? 'opacity-100' : 'opacity-90'}
        />

        {/* Unread-messages badge */}
        {totalUnread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#52b274] px-[3px] text-[9px] font-bold leading-none text-white shadow-sm ring-2 ring-background">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      <MobileDrawer
        open={open}
        onClose={() => setChatOpen(false)}
        title="Chat"
        anchor="right"
        showHeader={false}
      >
        <ChatContent />
      </MobileDrawer>
    </>
  );
};

export default ChatMenu;
