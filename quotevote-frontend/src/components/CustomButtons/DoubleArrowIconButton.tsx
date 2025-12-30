'use client';

import { ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DoubleArrowIconButtonProps } from '@/types/components';

/**
 * DoubleArrowIconButton Component
 * 
 * Icon button with double arrow icon, styled with primary green color.
 */
export function DoubleArrowIconButton({ onClick }: DoubleArrowIconButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      className="text-[#52b274] hover:text-[#52b274] hover:bg-[#52b274]/10"
    >
      <ChevronsRight size={20} />
    </Button>
  );
}

