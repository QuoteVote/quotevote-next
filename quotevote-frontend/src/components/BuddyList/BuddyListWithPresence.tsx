'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store';
import { GET_BUDDY_LIST, GET_ROSTER } from '@/graphql/queries';
import { usePresenceSubscription } from '@/hooks/usePresenceSubscription';
import { useRosterManagement } from '@/hooks/useRosterManagement';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Avatar from '@/components/Avatar'; // Import our new Avatar
import BuddyItemList from './BuddyItemList';
import { Buddy, BuddyItem, BuddyListWithPresenceProps, Presence, GetBuddyListData, GetRosterData } from '@/types/buddylist';

export default function BuddyListWithPresence({ search = '' }: BuddyListWithPresenceProps) {
    const currentUser = useAppStore((state) => state.user.data);
    const setBuddyList = useAppStore((state) => state.setBuddyList);
    // Note: setPendingRequests not available in store, we rely on local query data for this view.

    const presenceMap = useAppStore((state) => state.chat.presenceMap) as Record<string, Presence>;

    const { loading, data, refetch, error: buddyListError } = useQuery<GetBuddyListData>(GET_BUDDY_LIST, {
        fetchPolicy: 'cache-and-network',
        skip: !currentUser?._id,
    });

    const { data: rosterData, refetch: refetchRoster, error: rosterError } = useQuery<GetRosterData>(GET_ROSTER, {
        fetchPolicy: 'cache-and-network',
        skip: !currentUser?._id,
    });

    const { acceptBuddy, declineBuddy } = useRosterManagement();

    // Subscribe to presence updates
    usePresenceSubscription();

    // Sync buddy list to store — transform getBuddyList to the shape the store expects
    useEffect(() => {
        if (data?.getBuddyList) {
            const buddies = data.getBuddyList.map((entry) => ({
                id: entry.user._id,
                buddyId: entry.user._id,
                status: 'accepted',
                buddy: entry.user,
                presence: entry.presence,
            }));
            setBuddyList(buddies);
        }
    }, [data, setBuddyList]);

    // Derived state: Pending Requests from flat roster array
    const pendingRequests = useMemo(() => {
        if (!rosterData?.getRoster || !currentUser?._id) return [];

        const currentUserId = currentUser._id?.toString() || (currentUser.id as string | undefined);
        if (!currentUserId) return [];

        // Only show requests RECEIVED by the current user:
        // buddyId is currentUser AND initiatedBy is someone else
        return rosterData.getRoster
            .filter((entry) => {
                if (entry.status !== 'pending') return false;
                if (!entry.initiatedBy) return false;
                return (
                    entry.buddyId?.toString() === currentUserId &&
                    entry.initiatedBy?.toString() !== currentUserId
                );
            })
            .map((entry) => ({
                id: entry._id,
                buddyId: entry.userId,
                status: entry.status,
                buddy: entry.buddy,
            }));
    }, [rosterData, currentUser]);

    const handleAcceptBuddy = async (rosterId: string) => {
        try {
            await acceptBuddy(rosterId);
            toast.success('Buddy request accepted!');
            refetchRoster();
            refetch();
        } catch (error) {
            toast.error((error as Error).message || 'Failed to accept buddy request');
        }
    };

    const handleDeclineBuddy = async (rosterId: string) => {
        try {
            await declineBuddy(rosterId);
            toast('Buddy request declined');
            refetchRoster();
            refetch();
        } catch (error) {
            toast.error((error as Error).message || 'Failed to decline buddy request');
        }
    };

    if (!currentUser?._id) {
        return (
            <div className="p-5 text-center text-gray-400">
                Please log in to view your buddy list
            </div>
        );
    }

    if (loading && !data) return <LoadingSpinner size={50} />;

    if (buddyListError || rosterError) {
        return (
            <div className="p-5 text-center text-red-500">
                Error loading buddy list. Please try refreshing.
            </div>
        );
    }

    const buddyEntries = data?.getBuddyList || [];

    // Group by presence
    const groupedBuddies: Record<string, BuddyItem[]> = {
        online: [],
        away: [],
        dnd: [],
        offline: [],
    };

    buddyEntries.forEach((entry) => {
        const buddyUser = entry.user;
        if (!buddyUser) return;

        // Presence key might be buddy ID
        const presence = presenceMap[buddyUser._id] || entry.presence;
        const status = presence?.status || 'offline';

        if (status === 'invisible') return;

        const buddyWithPresence = {
            user: buddyUser,
            presence: presence || { status: 'offline' },
            Text: buddyUser.name || buddyUser.username || 'Unknown',
            statusMessage: presence?.statusMessage || '',
            room: null,
        };

        if (groupedBuddies[status]) {
            groupedBuddies[status].push(buddyWithPresence);
        } else {
            groupedBuddies.offline.push(buddyWithPresence);
        }
    });

    const filterBuddies = (list: BuddyItem[]) => {
        if (!list) return [];
        if (!search) return list;
        return list.filter((b) => {
            const name = b.Text?.toLowerCase() || '';
            return name.includes(search.toLowerCase());
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'bg-[#52b274] shadow-[#52b274]/20';
            case 'away': return 'bg-amber-400 shadow-amber-400/20';
            case 'dnd': return 'bg-red-500 shadow-red-500/20';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="flex-1 overflow-auto flex flex-col h-full bg-white">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
                <div className="p-2 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2 px-2 mb-2">
                        <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                            Pending Requests
                        </span>
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#52b274] text-white text-[10px] font-bold">
                            {pendingRequests.length}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        {pendingRequests.map((req: Buddy) => {
                            const buddy = req.buddy;
                            if (!buddy) return null;
                            return (
                                <div key={req.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                    <Avatar
                                        src={buddy.avatar || undefined}
                                        alt={buddy.username}
                                        fallback={buddy.username?.[0]}
                                        size="sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold truncate">
                                            {buddy.name || buddy.username}
                                        </div>
                                        <div className="text-xs text-gray-500 italic">
                                            Wants to be your buddy
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleAcceptBuddy(req.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#52b274] text-white hover:bg-[#4a9e63] transition-colors"
                                            title="Accept"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeclineBuddy(req.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                            title="Decline"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Buddy Sections */}
            {['online', 'away', 'dnd', 'offline'].map((status) => {
                const filtered = filterBuddies(groupedBuddies[status]);
                if (filtered.length === 0) return null;

                return (
                    <div key={status}>
                        <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100">
                            <span className={cn("w-2 h-2 rounded-full shadow-sm ring-1 ring-white", getStatusColor(status))} />
                            <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                                {status === 'dnd' ? 'Do Not Disturb' : status} ({filtered.length})
                            </span>
                        </div>
                        <BuddyItemList buddyList={filtered} />
                    </div>
                );
            })}
        </div>
    );
}
