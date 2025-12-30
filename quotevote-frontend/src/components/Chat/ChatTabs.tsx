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
    'flex flex-1 items-center justify-center gap-1.5 border-b-2 border-transparent px-3 py-3 text-xs font-medium tracking-wide text-muted-foreground transition-all hover:text-emerald-600 dark:hover:text-emerald-300';

  const activeTabClasses =
    'border-emerald-500 bg-emerald-50/70 text-emerald-700 shadow-sm dark:border-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-200';

  const badgeClasses =
    'inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-semibold text-white shadow-sm';

  return (
    <div className="flex border-b border-border bg-background/80 px-1">
      <button
        type="button"
        onClick={(event) => onChange(event, 'chats')}
        className={`${baseTabClasses} ${value === 'chats' ? activeTabClasses : ''
          }`}
      >
        <MessageCircle className="h-4 w-4" />
        <span>Chats</span>
        {dmCount > 0 && <span className={badgeClasses}>{dmCount}</span>}
      </button>

      <button
        type="button"
        onClick={(event) => onChange(event, 'groups')}
        className={`${baseTabClasses} ${value === 'groups' ? activeTabClasses : ''
          }`}
      >
        <Users2 className="h-4 w-4" />
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
        <UserRound className="h-4 w-4" />
        <span>Buddies</span>
        {onlineCount > 0 && (
          <span className={badgeClasses}>{onlineCount}</span>
        )}
      </button>
    </div>
  );
};

export default ChatTabs;

