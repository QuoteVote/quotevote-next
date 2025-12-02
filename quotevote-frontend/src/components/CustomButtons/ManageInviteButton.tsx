'use client';

import { Button } from '@/components/ui/button';
import type { ManageInviteButtonProps } from '@/types/components';
import { cn } from '@/lib/utils';

/**
 * ManageInviteButton Component
 * 
 * Button for navigating to admin panel/manage invites.
 */
export function ManageInviteButton({ className, ...props }: ManageInviteButtonProps) {
  return (
    <Button
      variant="default"
      className={cn(
        'font-roboto text-sm font-normal text-white',
        className
      )}
      {...props}
    >
      Admin Panel
    </Button>
  );
}

