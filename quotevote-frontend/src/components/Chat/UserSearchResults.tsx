"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Loader2, Check, UserCheck } from 'lucide-react';
import { useQuery } from '@apollo/client/react';

import Avatar from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { SEARCH_USERNAMES, GET_ROSTER } from '@/graphql/queries';
import { useRosterManagement } from '@/hooks/useRosterManagement';
import { useAppStore } from '@/store';
import { toast } from 'sonner';
import type { BuddySearchResult } from '@/types/chat';
import type { GetRosterData } from '@/types/buddylist';

interface UserSearchResultsProps {
  searchQuery: string;
}

interface SearchUserResponse {
  searchUser: BuddySearchResult[];
}

interface SearchUserVariables {
  query: string;
}

type BuddyRelation =
  | { type: 'buddy' }
  | { type: 'pending_sent' }
  | { type: 'pending_received'; rosterId: string };

const MIN_QUERY_LENGTH = 2;

const UserSearchResults: FC<UserSearchResultsProps> = ({ searchQuery }) => {
  const currentUser = useAppStore((state) => state.user.data) as
    | { _id?: string }
    | undefined;
  const { addBuddy, acceptBuddy } = useRosterManagement();
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [acceptingRosterId, setAcceptingRosterId] = useState<string | null>(null);

  const { data, loading } = useQuery<SearchUserResponse, SearchUserVariables>(
    SEARCH_USERNAMES,
    {
      variables: { query: searchQuery },
      skip: !searchQuery || searchQuery.length < MIN_QUERY_LENGTH,
    }
  );

  const { data: rosterData } = useQuery<GetRosterData>(GET_ROSTER, {
    fetchPolicy: 'cache-and-network',
    skip: !currentUser?._id,
  });

  const getBuddyRelation = (userId: string): BuddyRelation | null => {
    if (!rosterData?.getRoster || !currentUser?._id) return null;
    const currentUserId = currentUser._id;

    const entry = rosterData.getRoster.find(
      (r) =>
        (r.userId === currentUserId && r.buddyId === userId) ||
        (r.userId === userId && r.buddyId === currentUserId)
    );
    if (!entry) return null;
    if (entry.status === 'accepted') return { type: 'buddy' };
    if (entry.status === 'pending') {
      if (entry.buddyId === currentUserId) {
        return { type: 'pending_received', rosterId: entry._id };
      }
      return { type: 'pending_sent' };
    }
    return null;
  };

  const handleAddBuddy = async (userId: string): Promise<void> => {
    if (!currentUser || !currentUser._id || userId === currentUser._id) return;
    try {
      setAddingUserId(userId);
      await addBuddy(userId);
      toast.success('Buddy request sent!');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to send buddy request';
      toast.error(message);
    } finally {
      setAddingUserId(null);
    }
  };

  const handleAcceptBuddy = async (rosterId: string): Promise<void> => {
    try {
      setAcceptingRosterId(rosterId);
      await acceptBuddy(rosterId);
      toast.success('Buddy request accepted!');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to accept request'
      );
    } finally {
      setAcceptingRosterId(null);
    }
  };

  const users: BuddySearchResult[] = data?.searchUser ?? [];
  const filteredUsers = users.filter((user) => user._id !== currentUser?._id);

  if (!searchQuery || searchQuery.length < MIN_QUERY_LENGTH) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground">
        Type at least {MIN_QUERY_LENGTH} characters to search for users…
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Searching users…</p>
        </div>
      </div>
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground">
        <p className="mb-1 text-base font-semibold text-foreground">
          No users found
        </p>
        <p className="opacity-80">
          No users found matching &quot;{searchQuery}&quot;
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto px-2 py-2">
      {filteredUsers.map((user) => {
        const relation = getBuddyRelation(user._id);

        return (
          <div
            key={user._id}
            className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-sm shadow-sm transition hover:bg-accent/40"
          >
            <Avatar
              src={typeof user.avatar === 'string' ? user.avatar : undefined}
              alt={user.name || user.username}
              size={40}
              className="flex-shrink-0"
            />

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground">
                {user.name || user.username}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                @{user.username}
              </div>
            </div>

            {relation?.type === 'buddy' && (
              <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-[#52b274]">
                <UserCheck className="h-3.5 w-3.5" />
                Buddy
              </span>
            )}

            {relation?.type === 'pending_sent' && (
              <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Requested
              </span>
            )}

            {relation?.type === 'pending_received' && (
              <Button
                size="sm"
                onClick={() =>
                  handleAcceptBuddy(
                    (relation as { type: 'pending_received'; rosterId: string })
                      .rosterId
                  )
                }
                disabled={
                  acceptingRosterId ===
                  (relation as { type: 'pending_received'; rosterId: string })
                    .rosterId
                }
                className="ml-auto bg-[#52b274] text-white hover:bg-[#4a9e63]"
              >
                {acceptingRosterId ===
                (relation as { type: 'pending_received'; rosterId: string })
                  .rosterId ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Accept
                  </>
                )}
              </Button>
            )}

            {!relation && (
              <Button
                size="sm"
                onClick={() => handleAddBuddy(user._id)}
                disabled={addingUserId === user._id}
                className="ml-auto bg-[#52b274] text-white hover:bg-[#4a9e63] disabled:opacity-60"
              >
                {addingUserId === user._id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'Add Buddy'
                )}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default UserSearchResults;
