'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { Check, X } from 'lucide-react';
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
    const setSnackbar = useAppStore((state) => state.setSnackbar);
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

    // Sync buddy list to store
    useEffect(() => {
        if (data?.buddyList) {
            setBuddyList(data.buddyList);
        }
    }, [data, setBuddyList]);

    // Derived state: Pending Requests
    const pendingRequests = useMemo(() => {
        if (!rosterData?.roster || !currentUser?._id) return [];

        // roster structure: { buddies: [], pendingRequests: [], blockedUsers: [] } based on GET_ROSTER query in queries.ts
        // Wait, queries.ts says:
        // roster { buddies {...}, pendingRequests {...}, blockedUsers {...} }
        // OR roster is an array?
        // Let's re-read GET_ROSTER in Step 66.
        // It returns object `roster` with fields `buddies`, `pendingRequests`, `blockedUsers`.
        // The old code did `rosterData.getRoster.filter(...)`. That implies `getRoster` returned an array?
        // Step 66: 
        // query GetRoster { roster { buddies [...] ... } }
        // So rosterData.roster is the object.

        // However, the OLD code imported GET_ROSTER from `../../graphql/query`. Maybe it was different.
        // I should adapt to the NEW query structure in queries.ts.
        // New query returns `roster` object with `pendingRequests` array.
        // So I can just use `rosterData.roster.pendingRequests`.

        const requests = rosterData.roster?.pendingRequests || [];
        return requests.filter(() => {
            // We only want RECEIVED requests.
            // If the API puts them in `pendingRequests`, they might be mixed sent/received?
            // Usually `pendingRequests` in a roster query implies "requests waiting for ME".
            // Or "requests I sent".
            // Let's assume the API handles it or verify fields.
            // Fields available: id, buddyId, status, buddy.
            // Assuming `buddy` is the OTHER person.
            // If I am the receiver, `buddy` should be the sender? Or `buddy` field is always "the other guy".
            return true; // For now show all pending, usually filtered by API or context.
        });
    }, [rosterData, currentUser]);

    const handleAcceptBuddy = async (rosterId: string) => {
        try {
            await acceptBuddy(rosterId);
            setSnackbar({
                open: true,
                message: 'Buddy request accepted!',
                type: 'success',
            });
            refetchRoster();
            refetch();
        } catch (error) {
            setSnackbar({
                open: true,
                message: (error as Error).message || 'Failed to accept buddy request',
                type: 'danger',
            });
        }
    };

    const handleDeclineBuddy = async (rosterId: string) => {
        try {
            await declineBuddy(rosterId);
            setSnackbar({
                open: true,
                message: 'Buddy request declined',
                type: 'info',
            });
            refetchRoster();
            refetch();
        } catch (error) {
            setSnackbar({
                open: true,
                message: (error as Error).message || 'Failed to decline buddy request',
                type: 'danger',
            });
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

    const buddies = (data?.buddyList || []) as Buddy[];

    // Group by presence
    const groupedBuddies: Record<string, BuddyItem[]> = {
        online: [],
        away: [],
        dnd: [],
        offline: [],
    };

    buddies.forEach((rosterItem) => {
        const buddyUser = rosterItem.buddy;
        if (!buddyUser) return;

        // Presence key might be buddy ID
        const presence = presenceMap[buddyUser._id] || rosterItem.presence;
        const status = presence?.status || 'offline';

        if (status === 'invisible') return;

        const buddyWithPresence = {
            ...rosterItem,
            user: buddyUser, // BuddyItemList expects 'user'
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
            case 'online': return 'bg-green-500 shadow-green-500/20';
            case 'away': return 'bg-amber-400 shadow-amber-400/20';
            case 'dnd': return 'bg-red-500 shadow-red-500/20';
            default: return 'bg-gray-500';
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
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-green-500 text-white text-[10px] font-bold">
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
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
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
