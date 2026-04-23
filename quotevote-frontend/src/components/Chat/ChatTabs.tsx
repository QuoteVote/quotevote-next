"use client";

import type { FC, MouseEvent } from 'react';
import { MessageCircle, Users2, UserRound } from 'lucide-react';

type ChatTabValue = 'chats' | 'groups' | 'buddies';

interface ChatTabsProps {
  value: ChatTabValue;
  onChange: (event: MouseEvent<HTMLButtonElement>, value: ChatTabValue) => void;
  dmCount?: number;
  groupCount?: number;
  onlineCount?: number;
}

const ChatTabs: FC<ChatTabsProps> = ({
  value,
  onChange,
  dmCount = 0,
  groupCount = 0,
  onlineCount = 0,
}) => {
  const baseTabClasses =
    'flex flex-1 items-center justify-center gap-1.5 border-b-[3px] border-transparent px-3 py-3 text-xs font-medium tracking-wide text-muted-foreground transition-all duration-200 hover:text-[#52b274] dark:hover:text-[#52b274]';

  const activeTabClasses =
    'border-[#52b274] bg-[#52b274]/8 text-[#4a9e63] shadow-sm dark:border-[#52b274] dark:bg-[#52b274]/15 dark:text-[#52b274] [&>svg]:scale-110';

  const badgeClasses =
    'inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-[#52b274] px-1.5 text-[10px] font-semibold text-white shadow-sm';

  return (
    <div className="flex border-b border-border bg-background/80 px-1">
      <button
        type="button"
        onClick={(event) => onChange(event, 'chats')}
        className={`${baseTabClasses} ${value === 'chats' ? activeTabClasses : ''
          }`}
      >
        <MessageCircle className="h-4 w-4 transition-transform duration-200" />
        <span>Chats</span>
        {dmCount > 0 && <span className={badgeClasses}>{dmCount}</span>}
      </button>

      <button
        type="button"
        onClick={(event) => onChange(event, 'groups')}
        className={`${baseTabClasses} ${value === 'groups' ? activeTabClasses : ''
          }`}
      >
        <Users2 className="h-4 w-4 transition-transform duration-200" />
        <span>Groups</span>
        {groupCount > 0 && (
          <span className={badgeClasses}>{groupCount}</span>
        )}
      </button>

      <button
        type="button"
        onClick={(event) => onChange(event, 'buddies')}
        className={`${baseTabClasses} ${value === 'buddies' ? activeTabClasses : ''
          }`}
      >
        <UserRound className="h-4 w-4 transition-transform duration-200" />
        <span>Buddies</span>
        {onlineCount > 0 && (
          <span className={badgeClasses}>{onlineCount}</span>
        )}
      </button>
    </div>
  );
};

export default ChatTabs;

