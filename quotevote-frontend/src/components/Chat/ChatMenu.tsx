"use client";

import type { FC } from 'react';
import { useState } from 'react';

import ChatContent from './ChatContent';
// TODO: Migrate MobileDrawer component
// import MobileDrawer from '../Notifications/MobileDrawer';
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

  // TODO: These styles will be used when MobileDrawer is migrated
  // const appBarStyle = {
  //   backgroundColor: 'transparent',
  //   boxShadow: 'none',
  // } as const;

  // const backButtonStyle = {
  //   color: '#ffffff',
  // } as const;

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
      {/* TODO: Migrate MobileDrawer component */}
      {open && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">Chat</h2>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <ChatContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatMenu;
