'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store';
import { GET_BUDDY_LIST, GET_BUDDY_REQUESTS } from '@/graphql/queries';
import { usePresenceSubscription } from '@/hooks/usePresenceSubscription';
import { useBuddyManagement } from '@/hooks/useBuddyManagement';
import { cn } from '@/lib/utils';
import { PRESENCE_DOT_CLASS, PRESENCE_LABEL, PRESENCE_TEXT_CLASS, toPresenceStatus } from '@/lib/constants/presence';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DisplayAvatar } from '@/components/DisplayAvatar';
import BuddyItemList from './BuddyItemList';
import { Buddy, BuddyItem, BuddyListWithPresenceProps, Presence, GetBuddyListData, GetBuddyRequestsData } from '@/types/buddylist';

export default function BuddyListWithPresence({ search = '' }: BuddyListWithPresenceProps) {
    const currentUser = useAppStore((state) => state.user.data);
    const setBuddyList = useAppStore((state) => state.setBuddyList);
    // Note: setPendingRequests not available in store, we rely on local query data for this view.

    const presenceMap = useAppStore((state) => state.chat.presenceMap) as Record<string, Presence>;

    const { loading, data, refetch, error: buddyListError } = useQuery<GetBuddyListData>(GET_BUDDY_LIST, {
        fetchPolicy: 'cache-and-network',
        skip: !currentUser?._id,
    });

    const { data: requestsData, error: requestsError } = useQuery<GetBuddyRequestsData>(GET_BUDDY_REQUESTS, {
        fetchPolicy: 'cache-and-network',
        skip: !currentUser?._id,
    });

    const { acceptBuddy, declineBuddy } = useBuddyManagement();

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

    // Derived state: incoming pending requests (current user is the recipient)
    const pendingRequests = useMemo(() => {
        const currentUserId = currentUser?._id?.toString();
        if (!requestsData?.buddyRequests || !currentUserId) return [];

        return requestsData.buddyRequests
            .filter(
                (req) =>
                    req.status === 'pending' && req.recipient._id.toString() === currentUserId
            )
            .map((req) => ({
                id: req._id,
                buddyId: req.requester._id,
                status: req.status,
                buddy: req.requester,
            }));
    }, [requestsData, currentUser]);

    const handleAcceptBuddy = async (requestId: string) => {
        try {
            await acceptBuddy(requestId);
            toast.success('Buddy request accepted!');
            refetch();
        } catch (error) {
            toast.error((error as Error).message || 'Failed to accept buddy request');
        }
    };

    const handleDeclineBuddy = async (requestId: string) => {
        try {
            await declineBuddy(requestId);
            toast('Buddy request declined');
            refetch();
        } catch (error) {
            toast.error((error as Error).message || 'Failed to decline buddy request');
        }
    };

    if (!currentUser?._id) {
        return (
            <div className="p-5 text-center text-muted-foreground">
                Please log in to view your buddy list
            </div>
        );
    }

    if (loading && !data) return <LoadingSpinner size={50} />;

    if (buddyListError || requestsError) {
        return (
            <div role="alert" className="p-5 text-center text-[#c62828] dark:text-[#ff6b6b]">
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

    // Name or username; a leading @ is optional (#531).
    const query = search.trim().replace(/^@/, '').toLowerCase();
    const filterBuddies = (list: BuddyItem[]) => {
        if (!list) return [];
        if (!query) return list;
        return list.filter((b) => {
            const name = b.Text?.toLowerCase() || '';
            const username = b.user?.username?.toLowerCase() || '';
            return name.includes(query) || username.includes(query);
        });
    };

    const shownCount = ['online', 'away', 'dnd', 'offline'].reduce(
        (total, status) => total + filterBuddies(groupedBuddies[status]).length,
        0
    );

    return (
        <div className="flex-1 overflow-auto flex flex-col h-full bg-background">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
                <div className="p-2 bg-muted/60 border-b border-border">
                    <div className="flex items-center gap-2 px-2 mb-2">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                            Pending Requests
                        </span>
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#2f7a4c] text-white text-[10px] font-bold">
                            {pendingRequests.length}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        {pendingRequests.map((req: Buddy) => {
                            const buddy = req.buddy;
                            if (!buddy) return null;
                            return (
                                <div key={req.id} className="flex items-center gap-2 p-2 bg-card rounded-lg border border-border shadow-sm">
                                    <DisplayAvatar
                                        avatar={buddy.avatar as string | Record<string, unknown> | undefined}
                                        username={buddy.username}
                                        size={32}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-foreground truncate">
                                            {buddy.name || buddy.username}
                                        </div>
                                        <div className="text-xs text-muted-foreground italic">
                                            Wants to be your buddy
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleAcceptBuddy(req.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2f7a4c] text-white hover:bg-[#276640] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                            title="Accept"
                                            aria-label={`Accept ${buddy.name || buddy.username}`}
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeclineBuddy(req.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#8a8a93] text-muted-foreground hover:bg-red-50 hover:text-[#c62828] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] dark:border-[#6e7681] dark:hover:bg-red-950/40 dark:hover:text-[#ff6b6b]"
                                            title="Decline"
                                            aria-label={`Decline ${buddy.name || buddy.username}`}
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
                        <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-muted/95 backdrop-blur-sm border-b border-border">
                            <span className={cn("w-2.5 h-2.5 rounded-full", PRESENCE_DOT_CLASS[toPresenceStatus(status)])} aria-hidden="true" />
                            <h3 className={cn("text-xs! leading-4! font-bold uppercase tracking-wider", status === 'offline' ? 'text-muted-foreground' : PRESENCE_TEXT_CLASS[toPresenceStatus(status)])}>
                                {PRESENCE_LABEL[toPresenceStatus(status)]} ({filtered.length})
                            </h3>
                        </div>
                        <BuddyItemList buddyList={filtered} />
                    </div>
                );
            })}

            {query && shownCount === 0 && (
                <p className="px-6 py-10 text-center text-sm text-muted-foreground" data-testid="buddy-empty-search">
                    No buddies match “{search.trim()}”.
                </p>
            )}
        </div>
    );
}
