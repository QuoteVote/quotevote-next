"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { GET_BUDDY_LIST, GET_BUDDY_REQUESTS } from "@/graphql/queries";
import { usePresenceSubscription } from "@/hooks/usePresenceSubscription";
import { useBuddyManagement } from "@/hooks/useBuddyManagement";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DisplayAvatar } from "@/components/DisplayAvatar";
import BuddyItemList from "./BuddyItemList";
import {
  Buddy,
  BuddyItem,
  BuddyListWithPresenceProps,
  Presence,
  GetBuddyListData,
  GetBuddyRequestsData,
} from "@/types/buddylist";

export default function BuddyListWithPresence({ search = "" }: BuddyListWithPresenceProps) {
  const currentUser = useAppStore((state) => state.user.data);
  const setBuddyList = useAppStore((state) => state.setBuddyList);
  // Note: setPendingRequests not available in store, we rely on local query data for this view.

  const presenceMap = useAppStore((state) => state.chat.presenceMap) as Record<string, Presence>;

  const {
    loading,
    data,
    refetch,
    error: buddyListError,
  } = useQuery<GetBuddyListData>(GET_BUDDY_LIST, {
    fetchPolicy: "cache-and-network",
    skip: !currentUser?._id,
  });

  const { data: requestsData, error: requestsError } = useQuery<GetBuddyRequestsData>(
    GET_BUDDY_REQUESTS,
    {
      fetchPolicy: "cache-and-network",
      skip: !currentUser?._id,
    }
  );

  const { acceptBuddy, declineBuddy } = useBuddyManagement();

  // Subscribe to presence updates
  usePresenceSubscription();

  // Sync buddy list to store — transform getBuddyList to the shape the store expects
  useEffect(() => {
    if (data?.getBuddyList) {
      const buddies = data.getBuddyList.map((entry) => ({
        id: entry.user._id,
        buddyId: entry.user._id,
        status: "accepted",
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
      .filter((req) => req.status === "pending" && req.recipient._id.toString() === currentUserId)
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
      toast.success("Buddy request accepted!");
      refetch();
    } catch (error) {
      toast.error((error as Error).message || "Failed to accept buddy request");
    }
  };

  const handleDeclineBuddy = async (requestId: string) => {
    try {
      await declineBuddy(requestId);
      toast("Buddy request declined");
      refetch();
    } catch (error) {
      toast.error((error as Error).message || "Failed to decline buddy request");
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
    const status = presence?.status || "offline";

    if (status === "invisible") return;

    const buddyWithPresence = {
      user: buddyUser,
      presence: presence || { status: "offline" },
      Text: buddyUser.name || buddyUser.username || "Unknown",
      statusMessage: presence?.statusMessage || "",
      room: null,
    };

    if (groupedBuddies[status]) {
      groupedBuddies[status].push(buddyWithPresence);
    } else {
      groupedBuddies.offline.push(buddyWithPresence);
    }
  });

  // Name or username; a leading @ is optional (#531).
  const query = search.trim().replace(/^@/, "").toLowerCase();
  const filterBuddies = (list: BuddyItem[]) => {
    if (!list) return [];
    if (!query) return list;
    return list.filter((b) => {
      const name = b.Text?.toLowerCase() || "";
      const username = b.user?.username?.toLowerCase() || "";
      return name.includes(query) || username.includes(query);
    });
  };

  const shownCount = ["online", "away", "dnd", "offline"].reduce(
    (total, status) => total + filterBuddies(groupedBuddies[status]).length,
    0
  );

  // One flat list in presence order (design): online, away, do not disturb, offline.
  const buddies = ["online", "away", "dnd", "offline"].flatMap((status) =>
    filterBuddies(groupedBuddies[status])
  );

  return (
    <div className="qv-buddies" data-testid="buddy-list-with-presence">
      {pendingRequests.length > 0 && (
        <section className="qv-pending" aria-labelledby="pending-requests-title">
          <h3 id="pending-requests-title" className="qv-pending-eyebrow">
            Pending requests · {pendingRequests.length}
          </h3>
          {pendingRequests.map((req: Buddy) => {
            const buddy = req.buddy;
            if (!buddy) return null;
            const name = buddy.name || buddy.username;
            return (
              <div key={req.id} className="qv-pending-row">
                <DisplayAvatar
                  avatar={buddy.avatar as string | Record<string, unknown> | undefined}
                  username={buddy.username}
                  size={36}
                />
                <div className="qv-pending-text">
                  <b>{name}</b>
                  <span>Wants to be your buddy</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAcceptBuddy(req.id)}
                  className="qv-msg-btn-sm qv-msg-btn-primary"
                  aria-label={`Accept ${name}`}
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => handleDeclineBuddy(req.id)}
                  className="qv-msg-btn-sm"
                  aria-label={`Decline ${name}`}
                >
                  Decline
                </button>
              </div>
            );
          })}
        </section>
      )}

      <h3 className="qv-buddies-eyebrow">Buddies · {buddies.length}</h3>
      {buddies.length > 0 ? (
        <BuddyItemList buddyList={buddies} />
      ) : (
        !query && (
          <p className="qv-buddies-empty">No buddies yet. Use Add buddy above to find someone.</p>
        )
      )}

      {query && shownCount === 0 && (
        <p className="qv-buddies-empty" data-testid="buddy-empty-search">
          No buddies match “{search.trim()}”.
        </p>
      )}
    </div>
  );
}
