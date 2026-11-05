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
import { toast } from 'sonner';
import { UPDATE_PRESENCE } from '@/graphql/mutations';
import { cn } from '@/lib/utils';
import { PRESENCE_STATUS_OPTIONS, STATUS_MESSAGE_MAX_LENGTH } from '@/lib/constants/presence';
import { toDeclaredStatus } from '@/lib/utils/presence';
import type { DeclaredPresenceStatus } from '@/types/chat';

interface StatusEditorProps {
  open: boolean;
  onClose: () => void;
}

interface UpdatePresenceVariables {
  presence: {
    status: DeclaredPresenceStatus;
    statusMessage?: string;
  };
}

const StatusEditor: FC<StatusEditorProps> = ({ open, onClose }) => {
  const chatState = useAppStore((state) => state.chat);
  const setUserStatus = useAppStore((state) => state.setUserStatus);

  // Initialize state from chatState - reset when dialog opens using key prop.
  // No status chosen yet means Invisible (#468).
  const [status, setStatus] = useState<DeclaredPresenceStatus>(() =>
    toDeclaredStatus(chatState.userStatus)
  );
  const [statusMessage, setStatusMessage] = useState(
    () => chatState.userStatusMessage || ''
  );

  // Update state when dialog opens - using setTimeout to defer state update
  useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        setStatus(toDeclaredStatus(chatState.userStatus));
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

  // Invisible has no public message: the field is disabled, and nothing is
  // saved, so an old message cannot be read from the API either (#468).
  const isInvisible = status === 'invisible';

  const handleSave = async () => {
    const message = isInvisible ? '' : statusMessage.trim();

    try {
      await updatePresence({
        variables: {
          presence: { status, statusMessage: message },
        },
      });

      setUserStatus(status, message);
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status. Please try again.');
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
      <DialogContent className="sm:max-w-md space-y-4">
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
                  setStatus(toDeclaredStatus(e.target.value))
                }
                className={cn(
                  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none',
                  'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40'
                )}
              >
                {PRESENCE_STATUS_OPTIONS.map((option) => (
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
              value={isInvisible ? '' : statusMessage}
              onChange={(e) =>
                setStatusMessage(e.target.value.slice(0, STATUS_MESSAGE_MAX_LENGTH))
              }
              disabled={isInvisible}
              aria-describedby="status-message-help"
              placeholder={isInvisible ? 'Hidden while you are Invisible' : 'What are you up to?'}
              className="min-h-[80px] resize-none"
            />
            {isInvisible ? (
              <p id="status-message-help" className="text-xs text-muted-foreground">
                Nobody sees your status or message while you are Invisible. Pick Available,
                Away or Do Not Disturb to add a message.
              </p>
            ) : (
              <div
                id="status-message-help"
                className="flex justify-end text-xs text-muted-foreground"
              >
                {charCount}/{STATUS_MESSAGE_MAX_LENGTH} characters
              </div>
            )}
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

