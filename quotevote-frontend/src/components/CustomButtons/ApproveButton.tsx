'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ApproveButtonProps } from '@/types/components';
import { cn } from '@/lib/utils';

/**
 * ApproveButton Component
 * 
 * Button for approving/supporting posts with green styling.
 */
export function ApproveButton({ selected = false, count = 0, className, ...props }: ApproveButtonProps) {
  return (
    <Button
      variant={selected ? 'default' : 'outline'}
      className={cn(
        selected
          ? 'bg-[#4caf50] text-white border-[#4caf50] hover:bg-[#43a047]'
          : 'bg-transparent text-[#4caf50] border-[#4caf50] hover:bg-[#4caf50]/10',
        'flex items-center gap-1',
        className
      )}
      {...props}
    >
      <Check size={24} />
      <div className="flex items-center gap-1">
        SUPPORT
        {count > 0 && (
          <span className="text-xs font-bold ml-1">👍 {count}</span>
        )}
      </div>
    </Button>
  );
}

