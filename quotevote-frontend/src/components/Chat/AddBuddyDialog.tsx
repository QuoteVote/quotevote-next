"use client";

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@apollo/client/react';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Avatar from '@/components/Avatar';
import { SEARCH_USERNAMES } from '@/graphql/queries';
import { useRosterManagement } from '@/hooks/useRosterManagement';
import { useAppStore } from '@/store';
import type { BuddySearchResult } from '@/types/chat';

interface AddBuddyDialogProps {
  open: boolean;
  onClose: () => void;
}

interface SearchUserResponse {
  searchUser: BuddySearchResult[];
}

interface SearchUserVariables {
  query: string;
}

const MIN_QUERY_LENGTH = 2;

const AddBuddyDialog = ({ open, onClose }: AddBuddyDialogProps) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { addBuddy } = useRosterManagement();
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  const setSnackbar = useAppStore((state) => state.setSnackbar);
  const presenceMap = useAppStore((state) => state.chat.presenceMap);

  const { data, loading } = useQuery<SearchUserResponse, SearchUserVariables>(SEARCH_USERNAMES, {
    variables: { query: searchQuery },
    skip: !searchQuery || searchQuery.length < MIN_QUERY_LENGTH,
  });

  const handleAddBuddy = async (userId: string): Promise<void> => {
    try {
      setAddingUserId(userId);
      await addBuddy(userId);
      setSnackbar({
        open: true,
        message: 'Buddy request sent successfully!',
        type: 'success',
      });
      // Optionally close dialog after successful request
      // onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send buddy request';
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="mb-2 h-6 w-6 animate-spin" />
          <p className="text-sm">Searching users…</p>
        </div>
      );
    }

    if (searchQuery.length > 0 && searchQuery.length < MIN_QUERY_LENGTH) {
      return (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Type at least {MIN_QUERY_LENGTH} characters to search…
        </p>
      );
    }

    if (searchQuery.length >= MIN_QUERY_LENGTH && users.length === 0) {
      return (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No users found matching "{searchQuery}"
        </p>
      );
    }

    if (users.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
        {users.map((user) => {
          const presence = presenceMap[user._id];
          const isOnline = presence?.status === 'online';

          return (
            <div
              key={user._id}
              className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm shadow-sm"
            >
              <div className="relative">
                <Avatar
                  src={user.avatar || undefined}
                  alt={user.name || user.username}
                  size={40}
                />
                {presence && (
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${isOnline ? 'bg-emerald-500' : 'bg-muted-foreground'
                      }`}
                    aria-label={isOnline ? 'Online' : 'Offline'}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
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
                {addingUserId === user._id ? 'Adding…' : 'Add'}
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Buddy</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <Input
            autoFocus
            placeholder="Search by name or username"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {renderContent()}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBuddyDialog;

