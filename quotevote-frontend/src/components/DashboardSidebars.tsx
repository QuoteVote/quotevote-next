'use client'

import { useQuery, useSubscription } from '@apollo/client/react'
import { Bell } from 'lucide-react'
import { useAppStore } from '@/store'
import { Notification } from '@/components/Notifications/Notification'
import ChatContent from '@/components/Chat/ChatContent'
import { GET_NOTIFICATIONS } from '@/graphql/queries'
import { NEW_NOTIFICATION_SUBSCRIPTION } from '@/graphql/subscriptions'
import type { Notification as NotificationType } from '@/types/notification'

/**
 * Fixed left (Notifications) + right (Chat / messages) sidebars shared by the
 * dashboard pages that align with the Home feed column — Profile and
 * Settings & Privacy. Positioning and breakpoints mirror `/dashboard/explore`
 * so the content's left/right edges stay consistent across pages.
 *
 * Feed-specific filters are intentionally omitted here (they only apply to
 * the explore feed).
 */
export function DashboardSidebars() {
  const user = useAppStore((state) => state.user.data)
  const isLoggedIn = !!(user?._id || user?.id)
  const userId = (user?._id || user?.id) as string | undefined

  const { loading, data, refetch } = useQuery(GET_NOTIFICATIONS, {
    skip: !isLoggedIn || !userId,
    fetchPolicy: 'cache-and-network',
  })

  useSubscription(NEW_NOTIFICATION_SUBSCRIPTION, {
    variables: { userId: userId || '' },
    skip: !isLoggedIn || !userId,
    onData: async () => {
      await refetch()
    },
  })

  const notifications: NotificationType[] =
    loading || !data
      ? []
      : (data as { notifications?: NotificationType[] }).notifications || []

  return (
    <>
      {/* ── Left: Notifications (fixed under navbar, lg+) ── */}
      <aside
        data-dashboard-aside="left"
        className="hidden lg:flex flex-col fixed top-[60px] left-0 w-[300px] xl:w-[340px] h-[calc(100vh-60px)] border-r border-border bg-background overflow-hidden z-30"
      >
        {isLoggedIn && userId && (
          <>
            <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-background">
              <Bell className="size-4 text-muted-foreground/60" />
              <span className="text-sm font-semibold text-foreground/80">Notifications</span>
              {notifications.length > 0 && (
                <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none shadow">
                  {notifications.length > 99 ? '99+' : notifications.length}
                </span>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2">
              <Notification
                loading={loading}
                notifications={notifications}
                refetch={refetch}
                pageView
              />
            </div>
          </>
        )}
      </aside>

      {/* ── Right: Messaging panel (fixed under navbar, xl+, logged in) ── */}
      {isLoggedIn && (
        <aside
          data-dashboard-aside="right"
          className="hidden xl:flex flex-col fixed top-[60px] right-0 w-[360px] 2xl:w-[420px] h-[calc(100vh-60px)] border-l border-border bg-background overflow-hidden z-30"
        >
          <ChatContent />
        </aside>
      )}
    </>
  )
}
