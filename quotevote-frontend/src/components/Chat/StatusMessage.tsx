"use client";

import type { FC } from 'react';

import { cn } from '@/lib/utils';

interface StatusMessageProps {
  message?: string | null;
  className?: string;
}

const StatusMessage: FC<StatusMessageProps> = ({ message, className }) => {
  if (!message) return null;

  return (
    <span
      className={cn(
        'text-[0.75rem] italic text-muted-foreground truncate',
        className
      )}
      title={message}
    >
      {message}
    </span>
  );
};

export default StatusMessage;

