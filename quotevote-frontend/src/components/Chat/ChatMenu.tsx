"use client";

import type { FC } from 'react';
import { useState } from 'react';

import ChatContent from './ChatContent';
import { MobileDrawer } from '@/components/Notifications/MobileDrawer';
import { useAppStore } from '@/store';

interface ChatMenuProps {
  fontSize?: 'small' | 'large' | string | number;
}

const ChatMenu: FC<ChatMenuProps> = ({ fontSize = 'medium' }) => {
  const open = useAppStore((state) => state.chat.open);
  const setChatOpen = useAppStore((state) => state.setChatOpen);
  const [isHovered, setIsHovered] = useState(false);

  const toggleOpen = () => {
    setChatOpen(!open);
  };

  const width = fontSize === 'large' ? 49 : 32;
  const height = fontSize === 'large' ? 46 : 30;

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
