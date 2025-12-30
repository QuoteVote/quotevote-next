'use client';

import { Button } from '@/components/ui/button';
import type { InvestButtonProps } from '@/types/components';
import { cn } from '@/lib/utils';

/**
 * InvestButton Component
 * 
 * Button for investment actions with responsive text.
 */
export function InvestButton({ handleClick, width }: InvestButtonProps) {
  const buttonText = width === 'xs' || width === 'sm' ? 'Invest' : 'Invest for change';

  return (
    <Button
      variant="default"
      onClick={handleClick}
      className={cn(
        'bg-white text-green-600 hover:bg-green-600 hover:text-white',
        'px-4 py-2.5 rounded-lg shadow-[1px_2px_#52b274]',
        'min-w-[250px] sm:min-w-[300px] sm:ml-[60px] ml-[25px]',
        'transition-all'
      )}
    >
      {buttonText}
    </Button>
  );
}

