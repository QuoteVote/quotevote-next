"use client";

import type { CSSProperties, FC, ReactElement, ReactNode } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

interface RichTooltipProps {
  content: ReactNode;
  children: ReactElement;
  open: boolean;
  onClose?: () => void;
  placement?: TooltipPlacement;
  /** Optional background color for the tooltip panel */
  tipColor?: string;
  /** Optional padding in pixels */
  spacing?: number;
  /** Optional background image or gradient string */
  tipBackgroundImage?: string;
  /** Kept for API compatibility; arrow is rendered via styling instead */
  arrow?: boolean;
}

const sideMap: Record<TooltipPlacement, 'top' | 'right' | 'bottom' | 'left'> = {
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
};

const RichTooltip: FC<RichTooltipProps> = ({
  placement = 'top',
  open,
  onClose,
  content,
  children,
  tipColor,
  spacing,
  tipBackgroundImage,
}) => {
  const side = sideMap[placement] ?? 'top';

  const style: CSSProperties = {};
  if (tipColor) {
    style.backgroundColor = tipColor;
  }
  if (tipBackgroundImage) {
    style.backgroundImage = tipBackgroundImage;
  }
  if (typeof spacing === 'number') {
    style.padding = `${spacing}px`;
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen: boolean) => {
      if (!nextOpen && onClose) {
        onClose();
      }
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
      side={side}
      sideOffset={8}
      className="max-w-xl rounded-md border bg-popover p-0 text-sm text-popover-foreground shadow-md"
      >
      <div
        className="relative max-w-full rounded-md"
        style={style}
      >
        {content}
      </div>
      </PopoverContent>
    </Popover>
  );
};

export default RichTooltip;
