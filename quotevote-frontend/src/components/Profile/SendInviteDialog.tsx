'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Loader2 } from 'lucide-react';
import type { SendInviteDialogProps } from '@/types/profile';
import { SEND_USER_INVITE } from '@/graphql/mutations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SendInviteDialog({
  open,
  onClose,
  onSuccess,
}: SendInviteDialogProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [sendInvite, { loading }] = useMutation<{
    sendUserInvite: { code: string; message?: string };
  }>(SEND_USER_INVITE, {
    onCompleted: (data) => {
      if (data.sendUserInvite.code === 'SUCCESS') {
        setSuccess('Invitation sent successfully!');
        setEmail('');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 2000);
      } else {
        setError(data.sendUserInvite.message || 'Failed to send invitation');
      }
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to send invitation');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await sendInvite({
        variables: { email },
      });
    } catch {
      // Error handled in onError callback
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send User Invitation</DialogTitle>
          <DialogDescription>
            Invite someone to join Quote.Vote. Your reputation score may be
            affected by the quality of users you invite.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-500 bg-green-50">
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                placeholder="user@example.com"
                autoFocus
              />
            </div>

            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Inviting high-quality users who contribute
              positively to the platform will improve your reputation score.
              Conversely, inviting users who receive reports or behave poorly may
              negatively impact your reputation.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !email}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

