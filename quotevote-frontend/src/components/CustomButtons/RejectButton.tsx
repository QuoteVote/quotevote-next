'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RejectButtonProps } from '@/types/components';
import { cn } from '@/lib/utils';

/**
 * RejectButton Component
 * 
 * Button for rejecting/disagreeing with posts with red styling.
 */
export function RejectButton({ selected = false, count = 0, className, ...props }: RejectButtonProps) {
  return (
    <Button
      variant={selected ? 'default' : 'outline'}
      className={cn(
        selected
          ? 'bg-[#f44336] text-white border-[#f44336] hover:bg-[#d32f2f]'
          : 'bg-transparent text-[#f44336] border-[#f44336] hover:bg-[#f44336]/10',
        'flex items-center gap-1',
        className
      )}
      {...props}
    >
      <X size={24} />
      <div className="flex items-center gap-1">
        DISAGREE
        {count > 0 && (
          <span className="text-xs font-bold ml-1">👎 {count}</span>
        )}
      </div>
    </Button>
  );
}

