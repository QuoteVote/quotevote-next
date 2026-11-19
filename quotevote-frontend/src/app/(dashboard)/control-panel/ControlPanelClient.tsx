'use client'

import { Suspense, useState } from 'react'
import { useQuery } from '@apollo/client/react'
import {
  ShieldCheck,
  AlertCircle,
  Mail,
  BarChart3,
  Star,
  Users,
  FileText,
  Bot,
  ChevronRight,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { DisplayAvatar } from '@/components/DisplayAvatar'
import { cn } from '@/lib/utils'
import { USER_INVITE_REQUESTS } from '@/graphql/queries'
import { useAppStore } from '@/store/useAppStore'
import type { UserInviteRequestsResponse } from '@/types/admin'
import type { SettingsUserData } from '@/types/settings'

import BotListTab from '@/components/Admin/BotListTab'
import UserInviteRequestsTab from '@/components/Admin/UserInviteRequestsTab'
import PostModerationTab from '@/components/Admin/PostModerationTab'
import FeaturedPostsTab from '@/components/Admin/FeaturedPostsTab'
import UserManagementTab from '@/components/Admin/UserManagementTab'
import StatisticsTab from '@/components/Admin/StatisticsTab'

type TabId = 'statistics' | 'invites' | 'featured' | 'users' | 'moderation' | 'bots'

const NAV_ITEMS: {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
  /** The design's glyph in the desktop sidebar tile. */
  glyph: string
  description: string
}[] = [
  { id: 'statistics', label: 'Statistics', icon: BarChart3, glyph: '▥', description: 'Platform overview & metrics' },
  { id: 'invites', label: 'Invites', icon: Mail, glyph: '✉', description: 'Manage invitation requests' },
  { id: 'featured', label: 'Featured', icon: Star, glyph: '★', description: 'Manage featured posts' },
  { id: 'users', label: 'Users', icon: Users, glyph: '◎', description: 'Manage user accounts' },
  { id: 'moderation', label: 'Moderation', icon: FileText, glyph: '⚑', description: 'Review pending posts' },
  { id: 'bots', label: 'Reports', icon: Bot, glyph: '⚠', description: 'Bot-flagged accounts' },
]

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56 rounded-lg" />
      <Skeleton className="h-4 w-40 rounded" />
      <Skeleton className="h-[320px] w-full rounded-xl" />
    </div>
  )
}

export default function ControlPanelClient() {
  const [activeTab, setActiveTab] = useState<TabId>('statistics')
  const userData = useAppStore((s) => s.user.data) as SettingsUserData | undefined
  const isAdmin = !!userData?.admin

  const { data, loading, error, refetch } = useQuery<UserInviteRequestsResponse>(
    USER_INVITE_REQUESTS,
    {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
      skip: !isAdmin,
    }
  )

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="flex justify-center">
            <div className="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="size-8 text-destructive" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Admin privileges are required to view this page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const inviteData = data?.userInviteRequests || []
  const pendingInvites = inviteData.filter((r) => Number(r.status) === 1).length

  const renderContent = () => {
    if (loading && !data && activeTab === 'invites') return <TabSkeleton />
    if (error && !data && activeTab === 'invites') {
      return (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>Error loading data: {error.message}</AlertDescription>
        </Alert>
      )
    }
    switch (activeTab) {
      case 'statistics':
        return <Suspense fallback={<TabSkeleton />}><StatisticsTab inviteData={inviteData} /></Suspense>
      case 'invites':
        return <Suspense fallback={<TabSkeleton />}><UserInviteRequestsTab data={inviteData} onRefresh={async () => { await refetch() }} /></Suspense>
      case 'featured':
        return <Suspense fallback={<TabSkeleton />}><FeaturedPostsTab /></Suspense>
      case 'users':
        return <Suspense fallback={<TabSkeleton />}><UserManagementTab /></Suspense>
      case 'moderation':
        return <Suspense fallback={<TabSkeleton />}><PostModerationTab /></Suspense>
      case 'bots':
        return <Suspense fallback={<TabSkeleton />}><BotListTab /></Suspense>
      default:
        return null
    }
  }

  const activeItem = NAV_ITEMS.find((n) => n.id === activeTab)!

  return (
    <div className="min-h-[calc(100vh-var(--app-header-h))] -mx-4 md:-mx-4">

      {/* ── Mobile: sticky top bar ── */}
      <div className="lg:hidden sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
          <div className="size-8 rounded-lg bg-gradient-to-br from-[#52b274] to-[#3d9659] flex items-center justify-center shadow-sm">
            <ShieldCheck className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">Control Panel</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Admin Dashboard</p>
          </div>
        </div>
        <div className="flex overflow-x-auto px-2 py-2 gap-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const hasBadge = id === 'invites' && pendingInvites > 0
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-3.5 py-2 rounded-lg flex-shrink-0 transition-all',
                  activeTab === id
                    ? 'bg-[#52b274] text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="size-4" />
                <span className="text-[10px] font-semibold whitespace-nowrap">{label}</span>
                {hasBadge && (
                  <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingInvites}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sidebar on desktop, the tab content once for every screen size */}
      <div className="lg:flex">
        {/* Sidebar */}
        <aside
          className="qv-admin-nav font-sans hidden lg:flex sticky top-[var(--app-header-h)] min-h-[calc(100vh-var(--app-header-h))] w-[280px] shrink-0 flex-col gap-1.5 self-start px-4 py-[22px]"
          aria-label="Control panel"
        >
          <div className="mb-2 flex items-center gap-3 border-b border-[var(--anav-divider)] px-2 pb-[18px]">
            <span
              className="flex size-[42px] items-center justify-center rounded-xl bg-gradient-to-br from-[#52b274] to-[#1f7a4d] text-white shadow-[0_8px_18px_-8px_#1f7a4d] [.neo-brutalism_&]:rounded-[4px]"
              aria-hidden="true"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <div className="leading-tight">
              <b className="text-base">Control Panel</b>
              <br />
              <span className="text-[12.5px] text-[var(--anav-desc)]">Admin Dashboard</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5" aria-label="Admin sections">
            {NAV_ITEMS.map(({ id, label, glyph, description }) => {
              const isActive = activeTab === id
              const badge = id === 'invites' && pendingInvites > 0 ? pendingInvites : null
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className="qv-anav"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="qv-anav-ic text-sm font-bold" aria-hidden="true">
                    {glyph}
                  </span>
                  <span className="flex flex-1 flex-col">
                    <b className="text-[14.5px]">{label}</b>
                    <span className="qv-anav-desc">{description}</span>
                  </span>
                  {badge !== null && (
                    <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#e5484d] px-1.5 text-[11px] font-bold text-white">
                      {badge}
                      <span className="sr-only"> pending</span>
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto flex items-center gap-2.5 border-t border-[var(--anav-divider)] px-2 pt-3.5 text-[13px]">
            <DisplayAvatar
              avatar={userData?.avatar as string | Record<string, unknown> | undefined}
              username={userData?.username || 'admin'}
              size={32}
              className="size-8"
            />
            <span className="leading-snug">
              Logged in as <b>{userData?.username || 'admin'}</b>
              <br />
              <span className="text-[12.5px] text-[var(--anav-desc)]">Admin</span>
            </span>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Breadcrumb bar (the Invites tab has its own heading) */}
          {activeTab !== 'invites' && (
          <div className="hidden lg:block px-6 py-3.5 border-b border-border bg-background/80 backdrop-blur sticky top-[var(--app-header-h)] z-10">
            <div className="flex items-center gap-1.5 text-sm">
              <ShieldCheck className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Admin</span>
              <ChevronRight className="size-3.5 text-muted-foreground/50" />
              <span className="font-semibold text-foreground">{activeItem.label}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{activeItem.description}</p>
          </div>
          )}

          <div className={activeTab === 'invites' ? 'p-4 lg:px-9 lg:py-7' : 'p-4 lg:p-6'}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}
