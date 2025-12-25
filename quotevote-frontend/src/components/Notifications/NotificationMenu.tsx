'use client';

import { useState } from 'react';
// @ts-expect-error - Apollo Client v4.0.9 has type resolution issues with useQuery/useSubscription exports
import { useQuery, useSubscription } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RichTooltip from '@/components/Chat/RichToolTip';
import { Notification } from './Notification';
import { MobileDrawer } from './MobileDrawer';
import { GET_NOTIFICATIONS } from '@/graphql/queries';
import { NEW_NOTIFICATION_SUBSCRIPTION } from '@/graphql/subscriptions';
import { useAppStore } from '@/store';
import { useResponsive } from '@/hooks/useResponsive';
import type { Notification as NotificationType } from '@/types/notification';

interface NotificationMenuProps {
  fontSize?: 'small' | 'large';
}

export function NotificationMenu({ fontSize = 'small' }: NotificationMenuProps) {
  const { isMobile } = useResponsive();
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const userId = useAppStore((state) => state.user.data.id);

  const { loading, data, refetch, error } = useQuery(GET_NOTIFICATIONS, {
    skip: !userId,
  });

  useSubscription(NEW_NOTIFICATION_SUBSCRIPTION, {
    variables: { userId: userId || '' },
    skip: !userId,
    onData: async () => {
      await refetch();
    },
  });

  const notifications: NotificationType[] =
    loading || error || !data ? [] : data.notifications || [];

  const handleToggle = (): void => {
    setOpen(!open);
  };

  const handleClose = (): void => {
    setOpen(false);
  };

  const iconSize = fontSize === 'large' ? 49 : 32;
  const iconHeight = fontSize === 'large' ? 46 : 30;

  // Desktop popover content
  const popoverContent = (
    <RichTooltip
      content={
        <Notification
          loading={loading}
          notifications={notifications}
          refetch={refetch}
          setOpenPopUp={handleClose}
        />
      }
      open={open}
      placement="bottom"
      onClose={handleClose}
      tipColor="#F1F1F1"
      tipBackgroundImage="#F1F1F1"
      spacing={0}
    >
      <div className="relative">
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 z-10 min-w-[20px] h-5 flex items-center justify-center px-1"
        >
          {notifications.length > 0 ? notifications.length : null}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="p-2"
          aria-label="Notifications"
        >
          {isHovered ? (
            <img
              src="/assets/NotificationsActive.svg"
              alt="notifications active"
              style={{ width: `${iconSize}px`, height: `${iconHeight}px` }}
            />
          ) : (
            <img
              src="/assets/Notifications.svg"
              alt="notifications"
              style={{ width: `${iconSize}px`, height: `${iconHeight}px` }}
            />
          )}
        </Button>
      </div>
    </RichTooltip>
  );

  // Mobile drawer content
  const mobileContent = (
    <>
      <div className="relative">
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 z-10 min-w-[20px] h-5 flex items-center justify-center px-1"
        >
          {notifications.length > 0 ? notifications.length : null}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="p-2"
          aria-label="Notifications"
        >
          {isHovered ? (
            <img
              src="/assets/NotificationsActive.svg"
              alt="notifications active"
              style={{ width: `${iconSize}px`, height: `${iconHeight}px` }}
            />
          ) : (
            <img
              src="/assets/Notifications.svg"
              alt="notifications"
              style={{ width: `${iconSize}px`, height: `${iconHeight}px` }}
            />
          )}
        </Button>
      </div>
      <MobileDrawer
        open={open}
        onClose={handleClose}
        title="Notifications"
        anchor="right"
      >
        <Notification
          loading={loading}
          notifications={notifications}
          refetch={refetch}
          setOpenPopUp={handleClose}
          pageView
        />
      </MobileDrawer>
    </>
  );

  return <div className="flex items-center">{isMobile ? mobileContent : popoverContent}</div>;
}

