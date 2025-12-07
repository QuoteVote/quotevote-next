'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Loader2 } from 'lucide-react';
import type { ReportUserDialogProps } from '@/types/profile';
import { REPORT_USER } from '@/graphql/mutations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

const reportReasons = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'fake_account', label: 'Fake Account' },
  { value: 'other', label: 'Other' },
];

const severityLevels = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export function ReportUserDialog({
  open,
  onClose,
  reportedUser,
}: ReportUserDialogProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [reportUser, { loading }] = useMutation<{
    reportUser: { code: string; message?: string };
  }>(REPORT_USER, {
    onCompleted: (data) => {
      if (data.reportUser.code === 'SUCCESS') {
        setSuccess('User report submitted successfully!');
        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 2000);
      } else {
        setError(data.reportUser.message || 'Failed to submit report');
      }
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to submit report');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!reason) {
      setError('Please select a reason for the report');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description of the issue');
      return;
    }

    try {
      await reportUser({
        variables: {
          reportUserInput: {
            _reportedUserId: reportedUser._id,
            reason,
            description: description.trim(),
            severity,
          },
        },
      });
    } catch {
      // Error handled in onError callback
    }
  };

  const handleClose = () => {
    setReason('');
    setDescription('');
    setSeverity('medium');
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report User</DialogTitle>
          <DialogDescription>
            Reporting user:{' '}
            <strong>
              {reportedUser?.username || reportedUser?.name}
            </strong>
            <br />
            Please provide details about why you&apos;re reporting this user. False
            reports may affect your own reputation.
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
              <Label htmlFor="reason">Reason for Report *</Label>
              <Select
                value={reason}
                onValueChange={setReason}
                disabled={loading}
              >
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {reportReasons.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity Level</Label>
              <Select
                value={severity}
                onValueChange={setSeverity}
                disabled={loading}
              >
                <SelectTrigger id="severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                required
                placeholder="Please provide specific details about the issue..."
                rows={4}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              <strong>Important:</strong> False or malicious reports may
              negatively impact your reputation score. Please only report users
              for legitimate violations of community guidelines.
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
            <Button
              type="submit"
              variant="destructive"
              disabled={loading || !reason || !description.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

