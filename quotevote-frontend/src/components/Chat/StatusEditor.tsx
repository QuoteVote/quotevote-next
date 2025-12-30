"use client";

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client/react';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/store';
import { UPDATE_PRESENCE } from '@/graphql/mutations';
import { cn } from '@/lib/utils';

type PresenceStatus = 'online' | 'away' | 'dnd' | 'invisible';

interface StatusEditorProps {
  open: boolean;
  onClose: () => void;
}

interface UpdatePresenceVariables {
  presence: {
    status: PresenceStatus;
    statusMessage?: string;
  };
}

const statusOptions: Array<{
  value: PresenceStatus;
  label: string;
  icon: string;
}> = [
    { value: 'online', label: 'Online', icon: '🟢' },
    { value: 'away', label: 'Away', icon: '🟡' },
    { value: 'dnd', label: 'Do Not Disturb', icon: '🔴' },
    { value: 'invisible', label: 'Invisible', icon: '⚫' },
  ];

const StatusEditor: FC<StatusEditorProps> = ({ open, onClose }) => {
  const chatState = useAppStore((state) => state.chat);
  const setUserStatus = useAppStore((state) => state.setUserStatus);
  const setSnackbar = useAppStore((state) => state.setSnackbar);

  // Initialize state from chatState - reset when dialog opens using key prop
  const [status, setStatus] = useState<PresenceStatus>(
    () => (chatState.userStatus as PresenceStatus) || 'online'
  );
  const [statusMessage, setStatusMessage] = useState(
    () => chatState.userStatusMessage || ''
  );

  // Update state when dialog opens - using setTimeout to defer state update
  useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        setStatus((chatState.userStatus as PresenceStatus) || 'online');
        setStatusMessage(chatState.userStatusMessage || '');
      }, 0);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [open, chatState.userStatus, chatState.userStatusMessage]);

  const [updatePresence, { loading }] = useMutation<
    unknown,
    UpdatePresenceVariables
  >(UPDATE_PRESENCE);

  const handleSave = async () => {
    try {
      await updatePresence({
        variables: {
          presence: { status, statusMessage },
        },
      });

      setUserStatus(status, statusMessage);
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
      setSnackbar({
        open: true,
        type: 'danger',
        message: 'Failed to update status. Please try again.',
      });
    }
  };

  const charCount = statusMessage.length;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle>Set Your Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label
              htmlFor="status-select"
              className="block text-sm font-medium text-foreground"
            >
              Status
            </label>
            <div className="relative">
              <select
                id="status-select"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as PresenceStatus)
                }
                className={cn(
                  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none',
                  'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40'
                )}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {`${option.icon} ${option.label}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="status-message"
              className="block text-sm font-medium text-foreground"
            >
              Status Message
            </label>
            <Textarea
              id="status-message"
              value={statusMessage}
              onChange={(e) =>
                setStatusMessage(e.target.value.slice(0, 200))
              }
              placeholder="What are you up to?"
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-end text-xs text-muted-foreground">
              {charCount}/200 characters
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-white shadow-md hover:from-emerald-500 hover:to-emerald-500 disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none"
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatusEditor;

