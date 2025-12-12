"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@apollo/client/react';

import Avatar from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { SEARCH_USERNAMES } from '@/graphql/queries';
import { useRosterManagement } from '@/hooks/useRosterManagement';
import { useAppStore } from '@/store';
import type { BuddySearchResult } from '@/types/chat';

interface UserSearchResultsProps {
  searchQuery: string;
}

interface SearchUserResponse {
  searchUser: BuddySearchResult[];
}

interface SearchUserVariables {
  query: string;
}

const MIN_QUERY_LENGTH = 2;

const UserSearchResults: FC<UserSearchResultsProps> = ({ searchQuery }) => {
  const currentUser = useAppStore((state) => state.user.data) as
    | { _id?: string }
    | undefined;
  const setSnackbar = useAppStore((state) => state.setSnackbar);
  const { addBuddy } = useRosterManagement();
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  const { data, loading } = useQuery<SearchUserResponse, SearchUserVariables>(
    SEARCH_USERNAMES,
    {
      variables: { query: searchQuery },
      skip: !searchQuery || searchQuery.length < MIN_QUERY_LENGTH,
    }
  );

  const handleAddBuddy = async (userId: string): Promise<void> => {
    if (!currentUser || !currentUser._id || userId === currentUser._id) return;

    try {
      setAddingUserId(userId);
      await addBuddy(userId);
      setSnackbar({
        open: true,
        message: 'Buddy request sent successfully!',
        type: 'success',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to send buddy request';
      setSnackbar({
        open: true,
        message,
        type: 'danger',
      });
    } finally {
      setAddingUserId(null);
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
          No users found matching "{searchQuery}"
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto px-2 py-2">
      {filteredUsers.map((user) => (
        <div
          key={user._id}
          className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2 text-sm shadow-sm transition hover:bg-accent/40 hover:shadow-md"
        >
          <Avatar
            src={user.avatar || undefined}
            alt={user.name || user.username}
            size={40}
          />

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">
              {user.name || user.username}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              @{user.username}
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => handleAddBuddy(user._id)}
            disabled={addingUserId === user._id}
            className="ml-auto"
          >
            {addingUserId === user._id ? 'Adding…' : 'Add Buddy'}
          </Button>
        </div>
      ))}
    </div>
  );
};

export default UserSearchResults;

