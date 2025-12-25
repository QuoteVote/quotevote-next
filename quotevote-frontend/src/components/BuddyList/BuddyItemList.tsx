'use client';

import { useState, useEffect, useRef } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { MessageSquare, Users } from 'lucide-react';
import { useAppStore } from '@/store';
import { GET_CHAT_ROOM } from '@/graphql/queries';
import { cn } from '@/lib/utils';
import Avatar from '@/components/Avatar';
import PresenceIcon from '@/components/Chat/PresenceIcon';
import StatusMessage from '@/components/Chat/StatusMessage';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { BuddyItem, BuddyItemListProps, PresenceStatus } from '@/types/buddylist';
import { ChatRoom } from '@/types/chat';



const emptyData: BuddyItem[] = [
    { Text: 'Car Shark', type: 'USER', avatar: null },
    { Text: 'Four Aces', type: 'POST', avatar: null },
    { Text: 'Peter Parker', type: 'USER', avatar: null },
    { Text: 'Lebron James', type: 'USER', avatar: null },
    { Text: 'Twitter', type: 'POST', avatar: null },
];

const TruncatedText = ({ text, className }: { text: string; className?: string }) => {
    const textRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (textRef.current) {
                const element = textRef.current;
                setIsOverflowing(element.scrollWidth > element.clientWidth);
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [text]);

    const content = (
        <div ref={textRef} className={cn('truncate', className)}>
            {text}
        </div>
    );

    if (isOverflowing) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent>{text}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return content;
};

export default function BuddyItemList({ buddyList, className }: BuddyItemListProps) {
    const currentUser = useAppStore((state) => state.user.data);
    const setSelectedChatRoom = useAppStore((state) => state.setSelectedChatRoom);
    const [getChatRoom] = useLazyQuery<{ messageRoom: ChatRoom }>(GET_CHAT_ROOM);

    const itemList = buddyList && buddyList.length > 0 ? buddyList : emptyData;
    const isEmptyList = !buddyList || buddyList.length === 0;

    const handleClickItem = async (item: BuddyItem) => {
        if (isEmptyList || !currentUser || !currentUser._id) return;

        // 1. If item has a room object
        if (item.room && item.room._id) {
            setSelectedChatRoom(item.room._id);
            return;
        }

        // 2. If item is a specific room from messageRooms (mapped in index.jsx has .room)
        // But sometimes item IS the room (if mapped differently?). 
        // In index.jsx: map(item => ({ room: item ... })). So item.room is consistent.

        // 3. If item has a user (BuddyListWithPresence) but no room yet
        if (item.user && item.user._id) {
            try {
                // Attempt to find existing room
                const { data } = await getChatRoom({
                    variables: { otherUserId: item.user._id },
                });

                if (data && data.messageRoom && data.messageRoom._id) {
                    setSelectedChatRoom(data.messageRoom._id);
                } else {
                    // Room does not exist. 
                    // In new architecture, we might need a way to stage a new room.
                }
            } catch {
                // Handle error silently or via toast
            }
        }
    };

    if (isEmptyList) {
        return (
            <div className={cn('flex flex-col h-full', className)}>
                <div className="p-8 text-center text-gray-500">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-bold mb-2">No Conversations Yet</h3>
                    <p className="text-sm">
                        Start chatting by adding friends!<br />
                        Follow users to see them here.
                    </p>
                </div>
                <div className="opacity-60 pointer-events-none">
                    {emptyData.map((item, index) => (
                        <BuddyItemRow key={index} item={item} onClick={() => { }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <ul className={cn('flex flex-col w-full overflow-y-auto py-1', className)}>
            {itemList.map((item, index) => {
                if (!item) return null;
                // Key generation logic
                const itemKey = item.room?._id || item.user?._id || item._id || `item-${index}`;
                return <BuddyItemRow key={itemKey} item={item} onClick={() => handleClickItem(item)} />;
            })}
        </ul>
    );
}

function BuddyItemRow({ item, onClick }: { item: BuddyItem; onClick: () => void }) {
    const itemText = item.Text || item.user?.name || item.user?.username || item.room?.title || 'Unknown';
    // Determine type: 'USER' or 'POST' (group)
    // Logic from old file: const itemType = item.type || (item.user ? 'USER' : 'POST');
    // index.jsx maps item.messageType to item.type.
    const itemType = item.type || item.messageType || (item.user ? 'USER' : 'POST');

    // Avatar source resolution
    // Old code: <AvatarDisplay ... {...item.avatar} /> or item.user.avatar
    const rawAvatar = item.avatar || item.user?.avatar || item.room?.avatar;
    const avatarSrc = typeof rawAvatar === 'string' ? rawAvatar : rawAvatar?.url || undefined;

    return (
        <li
            className="relative flex items-center gap-3 px-4 py-3 m-1 rounded-xl cursor-pointer hover:bg-gray-50/50 transition-all border border-transparent hover:border-gray-200 hover:shadow-sm"
            onClick={onClick}
        >
            <div className="relative">
                <Avatar
                    src={typeof avatarSrc === 'string' ? avatarSrc : undefined}
                    alt={itemText}
                    fallback={itemText[0]}
                    size="md"
                    className="border-2 border-white shadow-sm"
                />
                {item.unreadMessages && item.unreadMessages > 0 ? (
                    <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center bg-green-600 text-white text-[10px] font-bold rounded-full px-1 shadow-sm ring-2 ring-white">
                        {item.unreadMessages > 99 ? '99+' : item.unreadMessages}
                    </span>
                ) : null}
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-2 max-w-full">
                    {/* Presence Icon */}
                    {item.presence && item.presence.status ? (
                        <PresenceIcon status={item.presence.status as PresenceStatus} />
                    ) : null}

                    <TruncatedText text={itemText} className="font-medium text-sm text-gray-900 flex-1 min-w-0" />

                    {/* Chip/Badge */}
                    <div
                        className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white shrink-0",
                            itemType === 'USER' ? "bg-green-600" : "bg-blue-600" // map theme.palette.success/secondary
                        )}
                    >
                        {itemType === 'USER' ? (
                            <MessageSquare className="w-3 h-3" />
                        ) : (
                            <Users className="w-3 h-3" />
                        )}
                        <span>{itemType === 'USER' ? 'FRIEND' : 'POST'}</span>
                    </div>
                </div>

                {/* Secondary Text */}
                <div className="min-w-0 text-xs text-gray-500 truncate">
                    {item.statusMessage ? (
                        <StatusMessage message={item.statusMessage} />
                    ) : item.presence?.status === 'away' ? (
                        <span className="text-amber-500 italic">Away</span>
                    ) : item.presence?.status === 'dnd' ? (
                        <span className="text-red-500 italic">Do Not Disturb</span>
                    ) : null}
                </div>
            </div>
        </li>
    );
}
