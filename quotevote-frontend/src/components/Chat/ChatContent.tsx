"use client";

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useQuery } from '@apollo/client/react';

import ChatSearchInput from './ChatSearchInput';
import MessageBox from './MessageBox';
import ChatTabs from './ChatTabs';
import ChatList from './ChatList';
import BuddyListWithPresence from '@/components/BuddyList/BuddyListWithPresence';
import UserSearchResults from './UserSearchResults';
import StatusEditor from './StatusEditor';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { GET_CHAT_ROOMS } from '@/graphql/queries';
import { cn } from '@/lib/utils';
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

function getStatusLabel(status: string): string {
  if (status === 'dnd') return 'Do Not Disturb';
  if (!status) return 'Online';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function UserStatusDisplay() {
  const userStatus = useAppStore((state) => state.chat.userStatus || 'online');
  const userStatusMessage = useAppStore(
    (state) => state.chat.userStatusMessage || ''
  );

  const label = userStatusMessage || getStatusLabel(userStatus);

  let dotClass = 'bg-zinc-400';
  if (userStatus === 'online') dotClass = 'bg-emerald-500';
  else if (userStatus === 'away') dotClass = 'bg-amber-400';
  else if (userStatus === 'dnd') dotClass = 'bg-red-500';

  return (
    <div className="inline-flex max-w-xs items-center gap-2 rounded-lg border border-white/30 bg-white/20 px-2 py-1 text-xs text-white backdrop-blur">
      <span
        className={cn(
          'h-2.5 w-2.5 rounded-full shadow shadow-black/30',
          dotClass
        )}
        aria-hidden="true"
      />
      <span className="truncate" title={label}>
        {label}
      </span>
    </div>
  );
}

function ChatContent() {
  const selectedRoomId = useAppStore((state) => state.chat.selectedRoom);
  const buddyList = useAppStore(
    (state) => state.chat.buddyList
  ) as BuddyListItem[];

  const [search, setSearch] = useState('');
  const [addBuddyMode, setAddBuddyMode] = useState(false);
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
    if (addBuddyMode) {
      setAddBuddyMode(false);
      setSearch('');
    }
  };

  const handleAddBuddyModeChange = (mode: boolean) => {
    setAddBuddyMode(mode);
    if (!mode) {
      setSearch('');
    }
  };

  const handleAddBuddyClick = () => {
    if (activeTab !== 'buddies') {
      setActiveTab('buddies');
    }
    setAddBuddyMode(true);
    setTimeout(() => {
      const input = document.querySelector<
        HTMLInputElement
      >('input[aria-label="search users to add"]');
      if (input) input.focus();
    }, 100);
  };

  // If no room is selected, show the sidebar view
  if (!selectedRoomId) {
    return (
      <div className="flex h-full w-full flex-col border-r bg-background shadow-lg lg:w-[400px]">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-white shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold tracking-tight">Messages</h2>
              <div className="mt-1">
                <UserStatusDisplay />
              </div>
            </div>
            <Button
              size="icon"
              variant="outline"
              className="border-white/40 bg-white/20 text-white hover:bg-white/30"
              onClick={() => setStatusEditorOpen(true)}
              aria-label="Set status"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="border-b bg-background px-4 py-3">
          <ChatSearchInput
            setSearch={setSearch}
            addBuddyMode={addBuddyMode}
            onAddBuddyModeChange={handleAddBuddyModeChange}
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
          />
        </div>

        {/* Add Buddy Button (only for buddies tab, hide when in add buddy mode) */}
        {activeTab === 'buddies' && !addBuddyMode && (
          <div className="border-b bg-gradient-to-br from-background to-muted px-4 py-3">
            <Button
              className="w-full justify-center bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:from-emerald-600 hover:to-emerald-700"
              onClick={handleAddBuddyClick}
            >
              Add New Buddy
            </Button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden bg-muted/40">
          {addBuddyMode ? (
            <UserSearchResults searchQuery={search} />
          ) : (
            <>
              {activeTab === 'chats' && (
                <ChatList search={search} filterType="chats" />
              )}
              {activeTab === 'groups' && (
                <ChatList search={search} filterType="groups" />
              )}
              {activeTab === 'buddies' && (
                <BuddyListWithPresence search={search} />
              )}
            </>
          )}
        </div>

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
    <div className="flex h-full w-full flex-col bg-background">
      <MessageBox />
    </div>
  );
}

export default ChatContent;
