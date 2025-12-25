'use client';

import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationLists } from './NotificationLists';
import { useResponsive } from '@/hooks/useResponsive';
import type { Notification as NotificationType } from '@/types/notification';
import { cn } from '@/lib/utils';

interface NotificationProps {
  loading: boolean;
  notifications: NotificationType[];
  spacing?: number;
  pageView?: boolean;
  setOpenPopUp?: () => void;
  refetch?: () => void;
}

export function Notification({
  loading,
  notifications,
  pageView = false,
  setOpenPopUp,
}: NotificationProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();

  const handleClick = (): void => {
    if (setOpenPopUp) {
      setOpenPopUp();
    }
    router.push('/Notifications');
  };

  return (
    <div
      className={cn(
        'm-2.5',
        pageView ? 'pr-7.5' : '',
        'bg-[var(--color-white)]'
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          {!isMobile && (
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Notifications
            </h2>
          )}
          {!pageView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClick}
              className="absolute top-5 right-1.25"
              aria-label="Open Notifications"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="border-t border-[var(--color-gray-light)]" />
        <div className="w-full">
          {loading && (
            <div className={cn('space-y-3', pageView ? 'w-full' : 'w-[350px]')}>
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton
                      className={cn(
                        'h-4',
                        pageView ? 'w-[400px]' : 'w-[45px]'
                      )}
                    />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && (
            <NotificationLists notifications={notifications} pageView={pageView} />
          )}
        </div>
      </div>
    </div>
  );
}

