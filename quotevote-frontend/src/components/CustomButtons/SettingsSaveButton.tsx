'use client';

import { Button } from '@/components/ui/button';
import type { SettingsSaveButtonProps } from '@/types/components';
import { cn } from '@/lib/utils';

/**
 * SettingsSaveButton Component
 * 
 * Submit button for saving settings.
 */
export function SettingsSaveButton({ className, ...props }: SettingsSaveButtonProps) {
  return (
    <Button
      type="submit"
      variant="default"
      className={cn(
        'font-roboto text-sm font-normal text-white disabled:text-white/60',
        className
      )}
      {...props}
    >
      Save
    </Button>
  );
}

