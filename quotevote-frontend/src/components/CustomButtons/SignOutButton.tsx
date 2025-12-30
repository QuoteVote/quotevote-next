'use client';

import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SignOutButtonProps } from '@/types/components';
import { cn } from '@/lib/utils';

/**
 * SignOutButton Component
 * 
 * Button for signing out, with exit icon.
 */
export function SignOutButton({ className, ...props }: SignOutButtonProps) {
  return (
    <Button
      variant="default"
      className={cn(
        'font-roboto text-sm font-normal text-white',
        className
      )}
      {...props}
    >
      <LogOut className="mr-2 size-4" />
      Sign out
    </Button>
  );
}

