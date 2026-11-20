"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { MessageCircle, SearchX } from "lucide-react";

import { GET_BUDDY_LIST, GET_CHAT_ROOMS, GET_CHAT_ROOM_SEARCH_DATA } from "@/graphql/queries";
import { useConversationTags } from "@/hooks/useConversationTags";
import { useMessageSearch } from "@/hooks/useMessageSearch";
import { conversationMatches, hasSearchTerms, tagToken } from "@/lib/utils/conversationSearch";
import { parseSearchQuery } from "@/utils/parseSearchQuery";
import { useAppStore } from "@/store";
import { LoadingSpinner } from "../LoadingSpinner";
import { DisplayAvatar } from "@/components/DisplayAvatar";
import { parseAvatarToUrl } from "@/lib/avatar";
import { toPresenceStatus } from "@/lib/constants/presence";
import type {
  ChatRoom,
  ChatRoomSearchMessage,
  ConversationPerson,
  ConversationTag,
  GetChatRoomSearchData,
  MessageSearchMatch,
} from "@/types/chat";
import type { GetBuddyListData } from "@/types/buddylist";

type ChatListFilter = "chats" | "groups";

interface GetChatRoomsData {
  messageRooms: ChatRoom[];
}

interface ChatListProps {
  search?: string;
  filterType: ChatListFilter;
  /** Sets the panel's search, e.g. to `#tag` when a discussion's tag is clicked (#531) */
  onSearchChange?: (value: string) => void;
}

const isDirectMessage = (room: ChatRoom) =>
  room.messageType === "USER" && (room.users?.length ?? 0) === 2;

const activityTime = (room: ChatRoom): number =>
  new Date(room.lastMessageTime || room.lastActivity || room.created).getTime();

const TINTS = ["blue", "tan", "purple"] as const;

/** A steady tint per discussion for its quote-mark tile (blue, tan or purple). */
export const tintFor = (id: string): (typeof TINTS)[number] => {
  let sum = 0;
  for (const ch of id) sum = (sum + ch.charCodeAt(0)) % 997;
  return TINTS[sum % TINTS.length];
};

const otherMember = (room: ChatRoom, me?: string): string | undefined =>
  (room.users ?? []).map(String).find((id) => id !== me);

/** "2:44 PM" today, "Yesterday", then "Mon" within the week, else "Nov 3". */
export const listTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const days = Math.floor(
    (new Date(now.toDateString()).getTime() - new Date(date.toDateString()).getTime()) / 86400000
  );
  if (days <= 0) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/** "Lena: The money…" for discussions, "✓✓ You: …" for your own message in a chat. */
export const previewLine = (room: ChatRoom, me?: string): string => {
  const last = room.lastMessage;
  if (!last?.text) {
    return isDirectMessage(room)
      ? "No messages yet"
      : room.postDetails?.text?.slice(0, 80) || "Discussion";
  }
  const mine = Boolean(me) && last.userId === me;
  if (mine)
    return `${isDirectMessage(room) ? (last.readByOther ? "✓✓ " : "✓ ") : ""}You: ${last.text}`;
  if (isDirectMessage(room)) return last.text;
  const first = (last.userName || "").trim().split(/\s+/)[0];
  return first ? `${first}: ${last.text}` : last.text;
};

const footerButtonClass =
  "inline-flex min-h-9 items-center rounded-md border border-[#8a8a93] px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] disabled:opacity-60 dark:border-[#6e7681]";

const ChatList: React.FC<ChatListProps> = ({ search = "", filterType, onSearchChange }) => {
  const selectedRoomId = useAppStore((state) => state.chat.selectedRoom);
  const setSelectedChatRoom = useAppStore((state) => state.setSelectedChatRoom);
  const currentUserId = useAppStore((state) => state.user.data?._id) as string | undefined;
  const presenceMap = useAppStore((state) => state.chat.presenceMap);

  const query = useMemo(() => parseSearchQuery(search), [search]);
  const searching = hasSearchTerms(query);

  const { loading, data, refetch } = useQuery<GetChatRoomsData>(GET_CHAT_ROOMS, {
    fetchPolicy: "cache-and-network",
    pollInterval: 10000,
  });

  // Message text is searched on the server, a page at a time (#601).
  const messageSearch = useMessageSearch(query.keywords.length > 0 ? query.textQuery : "");
  const { hasMore, loadingMore, loadMoreFailed, loadMore } = messageSearch;

  // Authors are only needed to find a person, so they stay out of the polled room list.
  const { data: searchData } = useQuery<GetChatRoomSearchData>(GET_CHAT_ROOM_SEARCH_DATA, {
    fetchPolicy: "cache-and-network",
    skip: !searching || query.usernames.length === 0,
  });
  const { data: buddyData } = useQuery<GetBuddyListData>(GET_BUDDY_LIST, {
    fetchPolicy: "cache-first",
    skip: !searching || query.usernames.length === 0,
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Next page when "Load more" nears the view. A page whose matches are all in the
  // other tab adds no rows, so this keeps going until the button leaves the view.
  const [loadMoreButton, setLoadMoreButton] = useState<HTMLButtonElement | null>(null);
  const [nearEnd, setNearEnd] = useState(false);

  useEffect(() => {
    if (!loadMoreButton) return;
    const observer = new IntersectionObserver(([entry]) => setNearEnd(entry.isIntersecting), {
      root: loadMoreButton.closest('[data-testid="discussion-list"]'),
      rootMargin: "200px",
    });
    observer.observe(loadMoreButton);
    return () => {
      observer.disconnect();
      setNearEnd(false);
    };
  }, [loadMoreButton]);

  useEffect(() => {
    if (nearEnd && hasMore && !loadingMore && !loadMoreFailed) void loadMore();
  }, [nearEnd, hasMore, loadingMore, loadMoreFailed, loadMore]);

  const rooms: ChatRoom[] = useMemo(() => data?.messageRooms ?? [], [data]);

  const filteredRooms = rooms.filter((room) => {
    if (filterType === "chats") {
      // Direct messages - USER type with 2 users
      return isDirectMessage(room);
    } else if (filterType === "groups") {
      // Discussions - POST type or more than 2 users
      return room.messageType === "POST" || (room.users?.length ?? 0) > 2;
    }
    return true;
  });

  const tags = useConversationTags(
    filteredRooms
      .filter((room) => room.messageType === "POST" && room.postDetails?._id)
      .map((room) => room.postDetails?._id as string)
  );
  const tagFor = (room: ChatRoom): ConversationTag | null =>
    room.postDetails?._id ? (tags[room.postDetails._id] ?? null) : null;

  const matchesByRoom = useMemo(() => {
    const map = new Map<string, MessageSearchMatch[]>();
    messageSearch.matches.forEach((match) => {
      map.set(match.messageRoomId, [...(map.get(match.messageRoomId) ?? []), match]);
    });
    return map;
  }, [messageSearch.matches]);

  const messagesByRoom = useMemo(() => {
    const map = new Map<string, ChatRoomSearchMessage[]>();
    searchData?.messageRooms?.forEach((room) => {
      if (room?._id) map.set(room._id, room.messages ?? []);
    });
    return map;
  }, [searchData]);

  const buddies = useMemo(() => {
    const map = new Map<string, ConversationPerson>();
    buddyData?.getBuddyList?.forEach((entry) => {
      if (entry?.user?._id) map.set(entry.user._id, entry.user);
    });
    return map;
  }, [buddyData]);

  const peopleIn = (room: ChatRoom, messages: ChatRoomSearchMessage[]): ConversationPerson[] => {
    const people: ConversationPerson[] = [];
    // A direct message's title is the other person's name.
    if (isDirectMessage(room) && room.title) people.push({ name: room.title });
    room.users?.forEach((id) => {
      const person = buddies.get(String(id));
      if (person && String(id) !== currentUserId) people.push(person);
    });
    messages.forEach((message) => {
      if (message.user && message.user._id !== currentUserId) people.push(message.user);
    });
    return people;
  };

  // Filter by search: text in the title, post or messages, @person and #tag (#531)
  const matchesSearch = (room: ChatRoom, snippets: string[]): boolean =>
    conversationMatches(room, query, {
      messages: snippets,
      people: peopleIn(room, messagesByRoom.get(room._id) ?? []),
      tag: tagFor(room),
    });

  const foundWithoutMessages = searching
    ? filteredRooms.filter((room) => matchesSearch(room, []))
    : filteredRooms;

  if (loading && !data) return <LoadingSpinner size={50} />;

  // Most recent first. Conversations found only through a message follow, in the
  // server's order, so each new page adds to the end instead of moving the list.
  const foundIds = new Set(foundWithoutMessages.map((room) => room._id));
  const roomsById = new Map(filteredRooms.map((room) => [room._id, room]));
  const foundThroughMessages = [...matchesByRoom.entries()].flatMap(([roomId, matches]) => {
    const room = roomsById.get(roomId);
    return room &&
      !foundIds.has(roomId) &&
      matchesSearch(
        room,
        matches.map((m) => m.snippet)
      )
      ? [room]
      : [];
  });
  const sortedRooms = [
    ...[...foundWithoutMessages].sort((a, b) => activityTime(b) - activityTime(a)),
    ...foundThroughMessages,
  ];

  const handleRoomClick = (room: ChatRoom) => {
    setSelectedChatRoom(room._id);
  };

  const resolveAvatar = (raw: ChatRoom["avatar"]): string | null =>
    parseAvatarToUrl(raw as string | Record<string, unknown> | undefined) || null;

  const getRoomDisplayInfo = (room: ChatRoom) => {
    if (isDirectMessage(room)) {
      return {
        name: room.title || "Direct Message",
        avatar: resolveAvatar(room.avatar),
        subtitle: "Direct message",
      };
    } else if (room.messageType === "POST") {
      const postTitle = room.postDetails?.title || room.title || "Quote Discussion";
      const postText = room.postDetails?.text || "";
      const preview = postText.length > 80 ? `${postText.substring(0, 80)}…` : postText;
      return {
        name: postTitle,
        avatar: resolveAvatar(room.avatar),
        subtitle: preview || "Discussion",
      };
    } else {
      return {
        name: room.title || "Discussion",
        avatar: resolveAvatar(room.avatar),
        subtitle: `${room.users?.length || 0} members`,
      };
    }
  };

  const noun = filterType === "chats" ? "chats" : "discussions";

  const stillLooking = messageSearch.pending || messageSearch.failed || hasMore;

  if (sortedRooms.length === 0 && !stillLooking) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center text-muted-foreground"
        data-testid={searching ? "chat-empty-search-state" : undefined}
      >
        <div className="mb-4 rounded-full bg-muted p-3">
          {searching ? (
            <SearchX className="h-8 w-8" aria-hidden="true" />
          ) : (
            <MessageCircle className="h-8 w-8" aria-hidden="true" />
          )}
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          {searching ? `No ${noun} match “${search.trim()}”` : `No ${noun} yet`}
        </h3>
        <p className="max-w-sm text-sm">
          {searching
            ? "Try other words, @name for a person or #tag for a tag."
            : filterType === "chats"
              ? "Open a buddy from the Buddies tab to start a conversation."
              : "Discussions on posts you write or comment on show up here."}
        </p>
        {searching && onSearchChange && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="mt-4 inline-flex min-h-9 items-center rounded-md border border-[#8a8a93] px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] dark:border-[#6e7681]"
          >
            Clear search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-2 pr-1" data-testid="discussion-list">
      {searching && (
        <p className="sr-only" role="status">
          {messageSearch.pending
            ? "Searching messages"
            : `${sortedRooms.length} ${sortedRooms.length === 1 ? noun.replace(/s$/, "") : noun} found`}
        </p>
      )}
      <ul className="qv-room-list">
        {sortedRooms.map((room) => {
          const displayInfo = getRoomDisplayInfo(room);
          const isSelected = typeof selectedRoomId === "string" && selectedRoomId === room._id;
          const tag = tagFor(room);
          const unread = room.unreadMessages ?? 0;
          const matches = matchesByRoom.get(room._id) ?? [];
          const preview = matches[0]?.snippet ?? previewLine(room, currentUserId);
          const dm = isDirectMessage(room);
          const other = dm ? otherMember(room, currentUserId) : undefined;
          const presence = other ? presenceMap[other]?.status : undefined;

          return (
            <li key={room._id} data-testid={searching ? "chat-search-result" : undefined}>
              <div
                className="qv-room"
                data-kind={dm ? "chat" : "discussion"}
                data-selected={isSelected || undefined}
                data-unread={unread > 0 || undefined}
              >
                <button
                  type="button"
                  onClick={() => handleRoomClick(room)}
                  data-testid="discussion-thread"
                  aria-current={isSelected ? "true" : undefined}
                  className="qv-room-main"
                >
                  {dm ? (
                    <span className="qv-room-avatar">
                      <DisplayAvatar
                        avatar={displayInfo.avatar}
                        username={displayInfo.name || ""}
                        size={44}
                      />
                      <span
                        className="qv-presence-dot"
                        data-status={toPresenceStatus(presence ?? "offline")}
                        aria-hidden="true"
                      />
                    </span>
                  ) : (
                    <span className="qv-room-tile" data-tint={tintFor(room._id)} aria-hidden="true">
                      &ldquo;
                    </span>
                  )}

                  <span className="qv-room-text">
                    <span className="qv-room-top">
                      <span className="qv-room-name">{displayInfo.name}</span>
                      {dm && room.lastMessageTime && (
                        <span className="qv-room-time">{listTime(room.lastMessageTime)}</span>
                      )}
                    </span>
                    <span className="qv-room-bottom">
                      <span className="qv-room-preview">{preview}</span>
                      {unread > 0 && (
                        <span className="qv-room-unread">
                          {unread > 99 ? "99+" : unread}
                          <span className="sr-only"> unread</span>
                        </span>
                      )}
                    </span>
                    {matches.length > 1 && (
                      <span className="qv-room-more" data-testid="chat-search-more-matches">
                        {`+${matches.length - 1} more ${matches.length === 2 ? "match" : "matches"}`}
                      </span>
                    )}
                  </span>
                </button>

                {/* The post's tag filters the list (#531). */}
                {tag && (
                  <button
                    type="button"
                    data-testid="discussion-tag"
                    onClick={() => onSearchChange?.(`#${tagToken(tag.title)}`)}
                    aria-label={`Show discussions tagged #${tag.title}`}
                    title={`Show discussions tagged #${tag.title}`}
                    className="qv-room-tag"
                  >
                    # {tag.title}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {messageSearch.pending && (
        <div
          className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
          data-testid="chat-search-pending"
        >
          <LoadingSpinner size={20} />
          Searching messages…
        </div>
      )}

      {messageSearch.failed && (
        <div
          className="flex flex-col items-center gap-2 px-4 py-4 text-center"
          data-testid="chat-search-error"
        >
          <p className="text-sm text-muted-foreground" role="alert">
            Couldn&apos;t search message text.
          </p>
          <button type="button" onClick={messageSearch.retry} className={footerButtonClass}>
            Try again
          </button>
        </div>
      )}

      {hasMore && (
        <div className="flex flex-col items-center gap-2 px-4 py-4 text-center">
          {loadMoreFailed && (
            <p className="text-sm text-muted-foreground" role="alert">
              Couldn&apos;t load more results.
            </p>
          )}
          <button
            ref={setLoadMoreButton}
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            data-testid="chat-search-load-more"
            className={footerButtonClass}
          >
            {loadingMore ? "Loading…" : loadMoreFailed ? "Try again" : "Load more results"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatList;
