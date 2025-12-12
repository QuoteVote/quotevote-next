"use client";

import type { FC } from 'react';
import { useState } from 'react';

import ChatContent from './ChatContent';
import MobileDrawer from '../Notifications/MobileDrawer';
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

  const appBarStyle = {
    backgroundColor: 'transparent',
    boxShadow: 'none',
  } as const;

  const backButtonStyle = {
    color: '#ffffff',
  } as const;

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
        className="relative inline-flex items-center justify-center rounded-full border border-transparent bg-background/80 p-1.5 text-muted-foreground shadow-sm transition-colors hover:border-emerald-400 hover:bg-emerald-50/80 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-900/40"
      >
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
        drawerPaperStyle={{
          width: '100%',
          maxWidth: 400,
          backgroundImage:
            'linear-gradient(224.94deg, #1BB5D8 1.63%, #4066EC 97.6%)',
        }}
        appBarStyle={appBarStyle}
        titleStyle={{
          color: '#ffffff',
          fontWeight: 600,
          textTransform: 'none',
        }}
        backButtonStyle={backButtonStyle}
      >
        <ChatContent />
      </MobileDrawer>
    </>
  );
};

export default ChatMenu;
