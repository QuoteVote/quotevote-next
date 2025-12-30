'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  anchor?: 'left' | 'right' | 'top' | 'bottom';
}

export function MobileDrawer({
  open,
  onClose,
  title,
  children,
  anchor = 'right',
}: MobileDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side={anchor} className="w-full max-w-[400px] sm:w-[400px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-[var(--color-gray-light)]">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <SheetTitle className="text-lg font-semibold text-[var(--color-text-primary)]">
              {title}
            </SheetTitle>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-auto">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

