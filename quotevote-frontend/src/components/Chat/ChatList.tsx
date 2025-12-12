"use client";

import { useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { MessageCircle, Users2 } from 'lucide-react';

import { GET_CHAT_ROOMS } from '@/graphql/queries';
import { useAppStore } from '@/store';
import LoadingSpinner from '../LoadingSpinner';
import Avatar from '@/components/Avatar';
import type { ChatRoom } from '@/types/chat';

type ChatListFilter = 'chats' | 'groups';

interface GetChatRoomsData {
  messageRooms: ChatRoom[];
}

interface ChatListProps {
  search?: string;
  filterType: ChatListFilter;
}

const ChatList: React.FC<ChatListProps> = ({ search = '', filterType }) => {
  const selectedRoomId = useAppStore((state) => state.chat.selectedRoom);
  const setSelectedChatRoom = useAppStore((state) => state.setSelectedChatRoom);

  const { loading, data, refetch } = useQuery<GetChatRoomsData>(GET_CHAT_ROOMS, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 10000,
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (loading && !data) return <LoadingSpinner size={50} />;

  const rooms: ChatRoom[] = data?.messageRooms || [];

  // Filter by type
  const filteredRooms = rooms.filter((room) => {
    if (filterType === 'chats') {
      // Direct messages - USER type with 2 users
      return room.messageType === 'USER' && room.users?.length === 2;
    } else if (filterType === 'groups') {
      // Group chats - POST type or more than 2 users
      return room.messageType === 'POST' || (room.users?.length ?? 0) > 2;
    }
    return true;
  });

  // Filter by search (simplified - just filter by title for now)
  const searchFiltered = search
    ? filteredRooms.filter((room) => {
      const title = room.title || '';
      return title.toLowerCase().includes(search.toLowerCase());
    })
    : filteredRooms;

  // Sort by last message time (most recent first), fallback to lastActivity, then created
  const sortedRooms = [...searchFiltered].sort((a, b) => {
    const aTime = a.lastMessageTime
      ? new Date(a.lastMessageTime).getTime()
      : a.lastActivity
        ? new Date(a.lastActivity).getTime()
        : new Date(a.created).getTime();
    const bTime = b.lastMessageTime
      ? new Date(b.lastMessageTime).getTime()
      : b.lastActivity
        ? new Date(b.lastActivity).getTime()
        : new Date(b.created).getTime();
    return bTime - aTime;
  });

  const handleRoomClick = (room: ChatRoom) => {
    setSelectedChatRoom(room._id);
  };

  const getRoomDisplayInfo = (room: ChatRoom) => {
    if (room.messageType === 'USER' && room.users?.length === 2) {
      // Direct message - use avatar from GraphQL response (resolved by server)
      return {
        name: room.title || 'Direct Message',
        avatar: room.avatar || null, // Use avatar from room (resolved by messageRoomRelationship)
        subtitle: `${room.users?.length || 0} participants`,
      };
    } else if (room.messageType === 'POST') {
      // Group chat for post - show post title
      const postTitle = room.postDetails?.title || room.title || 'Quote Discussion';
      const postText = room.postDetails?.text || '';
      const preview = postText.length > 50 ? `${postText.substring(0, 50)}...` : postText;
      return {
        name: postTitle,
        avatar: room.avatar || null, // Use avatar from room (will be set by server resolver for group chats)
        subtitle: preview || `${room.users?.length || 0} participants`,
        isGroup: true, // Flag to show group icon if no avatar
      };
    } else {
      // Other group chat - show title or default
      return {
        name: room.title || `Group Chat`,
        avatar: room.avatar || null, // Use avatar from room
        subtitle: `${room.users?.length || 0} members`,
        isGroup: true, // Flag to show group icon if no avatar
      };
    }
  };

  if (sortedRooms.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center text-muted-foreground">
        <div className="mb-4 rounded-full bg-muted p-3 text-muted-foreground/80">
          <MessageCircle className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          {search ? `No ${filterType} found` : `No ${filterType} yet`}
        </h3>
        <p className="max-w-sm text-sm">
          {search
            ? 'Try a different search term.'
            : filterType === 'chats'
              ? 'Add a buddy and start a conversation!'
              : 'Create a group or post to start chatting.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-2 pr-1">
      <ul className="flex flex-col gap-2 px-2">
        {sortedRooms.map((room) => {
          const displayInfo = getRoomDisplayInfo(room);
          const isSelected = selectedRoomId === room._id;

          const isDm = room.messageType === 'USER' && (room.users?.length ?? 0) === 2;

          return (
            <li key={room._id}>
              <button
                type="button"
                onClick={() => handleRoomClick(room)}
                className={
                  'flex w-full items-center gap-3 rounded-2xl border border-transparent bg-background px-3 py-3 text-left shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50/60 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-950/30 ' +
                  (isSelected
                    ? 'border-emerald-500 bg-emerald-50/80 shadow-md dark:bg-emerald-950/40'
                    : '')
                }
              >
                <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border bg-muted shadow-sm">
                  {displayInfo.avatar ? (
                    <Avatar
                      src={displayInfo.avatar}
                      alt={displayInfo.name || 'Chat avatar'}
                      size={48}
                    />
                  ) : displayInfo.isGroup ? (
                    <Users2 className="h-5 w-5 text-muted-foreground" />
                  ) : displayInfo.name ? (
                    <span className="text-base font-semibold text-foreground">
                      {displayInfo.name[0]?.toUpperCase() || '?'}
                    </span>
                  ) : (
                    <span className="text-base font-semibold text-foreground">?</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {displayInfo.name}
                    </span>
                    <span
                      className={
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ' +
                        (isDm
                          ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300')
                      }
                    >
                      {isDm ? (
                        <MessageCircle className="h-3 w-3" />
                      ) : (
                        <Users2 className="h-3 w-3" />
                      )}
                      {isDm ? 'DM' : 'Group'}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {displayInfo.subtitle}
                  </p>
                </div>

                {room.unreadMessages && room.unreadMessages > 0 && (
                  <div className="ml-2 flex h-6 min-w-[1.75rem] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white shadow-md">
                    {room.unreadMessages > 99 ? '99+' : room.unreadMessages}
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ChatList;

