"use client";

import { useState } from 'react';
import { Settings, UserPlus, X } from 'lucide-react';
import { useQuery } from '@apollo/client/react';

import ChatSearchInput from './ChatSearchInput';
import MessageBox from './MessageBox';
import ChatTabs from './ChatTabs';
import ChatList from './ChatList';
import BuddyListWithPresence from '@/components/BuddyList/BuddyListWithPresence';
import AddBuddyPanel from './AddBuddyPanel';
import StatusEditor from './StatusEditor';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { GET_CHAT_ROOMS } from '@/graphql/queries';
import { cn } from '@/lib/utils';
import {
  DEFAULT_PRESENCE_STATUS,
  OWN_PRESENCE_LABEL,
  PRESENCE_DOT_CLASS,
  toPresenceStatus,
} from '@/lib/constants/presence';
import type { ChatState } from '@/types/store';

type ChatTabValue = 'chats' | 'groups' | 'buddies';

interface ChatRoom {
  _id: string;
  messageType?: string | null;
  users?: string[] | null;
}

interface GetChatRoomsData {
  messageRooms: ChatRoom[];
}

type BuddyPresence = ChatState['presenceMap'][string];

interface BuddyListItem {
  id: string;
  buddyId: string;
  status: string;
  buddy: {
    id: string;
    username: string;
    avatar?: string | null;
  };
  presence?: BuddyPresence;
}

function UserStatusDisplay() {
  const userStatus = useAppStore((state) => state.chat.userStatus || DEFAULT_PRESENCE_STATUS);
  const userStatusMessage = useAppStore(
    (state) => state.chat.userStatusMessage || ''
  );

  const status = toPresenceStatus(userStatus);
  // Invisible has no public message, so none is shown even if one is stored (#468).
  const label = (status !== 'invisible' && userStatusMessage) || OWN_PRESENCE_LABEL[status];

  return (
    <div className="inline-flex max-w-xs items-center gap-2 rounded-lg border border-white/30 bg-black/15 px-2 py-1 text-xs text-white">
      {/* A white ring keeps every status dot visible on the green header (#531). */}
      <span
        className={cn('h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white', PRESENCE_DOT_CLASS[status])}
        aria-hidden="true"
      />
      <span className="truncate" title={label}>
        <span className="sr-only">Your status: </span>
        {label}
      </span>
    </div>
  );
}

function ChatContent() {
  const selectedRoomId = useAppStore((state) => state.chat.selectedRoom);
  const setChatOpen = useAppStore((state) => state.setChatOpen);
  const buddyList = useAppStore(
    (state) => state.chat.buddyList
  ) as BuddyListItem[];

  const [search, setSearch] = useState('');
  const [addBuddyOpen, setAddBuddyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatTabValue>('chats');
  const [statusEditorOpen, setStatusEditorOpen] = useState(false);

  // Initialize presence heartbeat
  usePresenceHeartbeat();

  // Calculate counts for badges
  const onlineCount = Array.isArray(buddyList)
    ? buddyList.filter((b: BuddyListItem) => {
      const status = b?.presence?.status || 'offline';
      return (
        status === 'online' || status === 'away' || status === 'dnd'
      );
    }).length
    : 0;

  // Get DM and Group counts
  const { data: roomsData } = useQuery<GetChatRoomsData>(GET_CHAT_ROOMS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const rooms = roomsData?.messageRooms || [];
  const dmCount = rooms.filter(
    (r) => r?.messageType === 'USER' && (r.users?.length ?? 0) === 2
  ).length;
  const groupCount = rooms.filter(
    (r) =>
      r?.messageType === 'POST' ||
      (r?.messageType === 'USER' && (r.users?.length ?? 0) > 2)
  ).length;

  const handleTabChange = (_: unknown, newValue: ChatTabValue) => {
    setActiveTab(newValue);
  };

  // Add Buddy is its own panel with its own field, separate from the search (#531).
  const handleAddBuddyClick = () => {
    setActiveTab('buddies');
    setAddBuddyOpen(true);
  };

  const searchPlaceholder =
    activeTab === 'buddies' ? 'Search buddies by name or @username' : 'Search messages, @people or #tags';
  const searchLabel = activeTab === 'buddies' ? 'Search buddies' : 'Search conversations';
  const headerButtonClass =
    'flex-shrink-0 border-white/50 bg-white/15 text-white hover:bg-white/25 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2f7a4c] dark:border-white/50 dark:bg-white/15 dark:hover:bg-white/25';

  // If no room is selected, show the sidebar view
  if (!selectedRoomId) {
    return (
      <div className="flex h-full w-full flex-col bg-background" data-testid="chat-page">
        {/* Header */}
        {/* A darker green keeps the white header text readable (#531). */}
        <div className="bg-gradient-to-br from-[#2f7a4c] to-[#276640] px-4 py-3 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold tracking-tight">Messages</h2>
              <div className="mt-1">
                <UserStatusDisplay />
              </div>
            </div>
            <Button
              size="icon"
              variant="outline"
              className={headerButtonClass}
              onClick={handleAddBuddyClick}
              aria-label="Add buddy"
              title="Add buddy"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className={headerButtonClass}
              onClick={() => setStatusEditorOpen(true)}
              aria-label="Set status"
              title="Set status"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className={headerButtonClass}
              onClick={() => setChatOpen(false)}
              aria-label="Close chat"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {addBuddyOpen ? (
          <AddBuddyPanel onBack={() => setAddBuddyOpen(false)} />
        ) : (
          <>
            {/* Search Bar: conversations and buddies only, no Add Buddy (#531) */}
            <div className="border-b bg-background px-4 py-3">
              <ChatSearchInput
                value={search}
                onChange={setSearch}
                placeholder={searchPlaceholder}
                ariaLabel={searchLabel}
              />
            </div>

            {/* Tabs */}
            <div className="border-b bg-background">
              <ChatTabs
                value={activeTab}
                onChange={handleTabChange}
                dmCount={dmCount}
                groupCount={groupCount}
                onlineCount={onlineCount}
                panelId="chat-tabpanel"
              />
            </div>

            {activeTab === 'buddies' && (
              <div className="border-b bg-background px-4 py-3">
                <Button
                  variant="outline"
                  className="min-h-10 w-full justify-center gap-2 border-[#2f7a4c] font-semibold text-[#2f6f4a] hover:bg-[#52b274]/10 hover:text-[#2f6f4a] focus-visible:ring-2 focus-visible:ring-[#52b274] dark:border-[#7fdc9c] dark:text-[#7fdc9c] dark:hover:text-[#7fdc9c]"
                  onClick={handleAddBuddyClick}
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  Add buddy
                </Button>
              </div>
            )}

            {/* Content Area */}
            <div
              id="chat-tabpanel"
              role="tabpanel"
              aria-labelledby={`chat-tab-${activeTab}`}
              className="flex flex-1 flex-col overflow-hidden bg-muted/40"
            >
              {activeTab === 'chats' && (
                <ChatList search={search} filterType="chats" onSearchChange={setSearch} />
              )}
              {activeTab === 'groups' && (
                <ChatList search={search} filterType="groups" onSearchChange={setSearch} />
              )}
              {activeTab === 'buddies' && (
                <BuddyListWithPresence search={search} />
              )}
            </div>
          </>
        )}

        {/* Status Editor Dialog */}
        <StatusEditor
          open={statusEditorOpen}
          onClose={() => setStatusEditorOpen(false)}
        />
      </div>
    );
  }

  // Room is selected: show conversation view
  return (
    <div className="flex h-full w-full flex-col bg-background" data-testid="chat-page">
      <MessageBox />
    </div>
  );
}

export default ChatContent;
