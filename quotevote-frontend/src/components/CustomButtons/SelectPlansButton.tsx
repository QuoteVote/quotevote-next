'use client';

import { Button } from '@/components/ui/button';
import type { SelectPlansButtonProps } from '@/types/components';
import { cn } from '@/lib/utils';

/**
 * SelectPlansButton Component
 * 
 * Button styled for plan selection with white text and border.
 */
export function SelectPlansButton({ className, ...props }: SelectPlansButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn('text-white border-white w-[120px] h-10', className)}
      {...props}
    />
  );
}

