import { ChatRoom } from './chat';

export type PresenceStatus = 'online' | 'away' | 'dnd' | 'offline' | 'invisible';

export interface Presence {
    status: PresenceStatus | string;
    statusMessage?: string;
    lastSeen?: number;
}

export interface BuddyUser {
    _id: string;
    name?: string;
    username?: string;
    avatar?: string | Record<string, unknown> | null;
}

export interface Buddy {
    id: string;
    buddyId: string;
    status: string;
    user?: BuddyUser;
    buddy?: BuddyUser;
    presence?: Presence;
}

export interface BuddyItem {
    _id?: string;
    room?: ChatRoom | null;
    user?: BuddyUser | null;
    Text?: string;
    messageType?: 'USER' | 'POST';
    type?: 'USER' | 'POST';
    avatar?: string | Record<string, unknown> | { url: string } | null;
    unreadMessages?: number;
    presence?: Presence;
    statusMessage?: string;
}

export interface BuddyListProps {
    search?: string;
}

export interface BuddyListWithPresenceProps {
    search?: string;
}

export interface BuddyItemListProps {
    buddyList: BuddyItem[];
    className?: string;
}

export interface GetChatRoomsData {
    messageRooms: ChatRoom[];
}

export interface GetBuddyListData {
    getBuddyList: Array<{
        user: BuddyUser;
        presence?: Presence;
    }>;
}

export interface BuddyRequest {
    _id: string;
    status: 'pending' | 'accepted';
    requester: BuddyUser;
    recipient: BuddyUser;
    createdAt?: string;
    acceptedAt?: string | null;
}

export interface GetBuddyRequestsData {
    buddyRequests: BuddyRequest[];
}
