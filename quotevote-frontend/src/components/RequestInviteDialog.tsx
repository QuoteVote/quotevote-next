// src/components/RequestInviteDialog.tsx
'use client';

import { JSX, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface RequestInviteDialogProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

/**
 * RequestInviteDialog - Dialog for requesting invites
 */
export function RequestInviteDialog({
  open,
  onClose,
  message = 'You need an invitation to perform this action.',
}: RequestInviteDialogProps): JSX.Element {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Invitation Required</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
          <AlertDialogAction onClick={onClose}>Request Invite</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
