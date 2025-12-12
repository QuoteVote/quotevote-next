"use client";

type PresenceStatus = 'online' | 'away' | 'dnd' | 'offline' | 'invisible';

interface PresenceIconProps {
  status: PresenceStatus;
  className?: string;
}

const statusClasses: Record<PresenceStatus, string> = {
  online:
    'bg-emerald-500 shadow-[0_0_0_2px_rgba(255,255,255,1),inset_0_0_0_1px_rgba(0,0,0,0.1)]',
  away:
    'bg-amber-400 shadow-[0_0_0_2px_rgba(255,255,255,1),inset_0_0_0_1px_rgba(0,0,0,0.1)]',
  dnd:
    'bg-red-500 shadow-[0_0_0_2px_rgba(255,255,255,1),inset_0_0_0_1px_rgba(0,0,0,0.1)]',
  offline:
    'bg-zinc-500 shadow-[0_0_0_2px_rgba(255,255,255,1),inset_0_0_0_1px_rgba(0,0,0,0.1)]',
  invisible:
    'bg-zinc-500 shadow-[0_0_0_2px_rgba(255,255,255,1),inset_0_0_0_1px_rgba(0,0,0,0.1)]',
};

const PresenceIcon = ({ status, className }: PresenceIconProps) => {
  const classes = statusClasses[status] ?? statusClasses.offline;

  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${classes} ${className ?? ''}`.trim()}
      aria-hidden="true"
    />
  );
};

export default PresenceIcon;

