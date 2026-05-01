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
import { Badge } from '@/components/ui/badge'
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
  description: string
}[] = [
  { id: 'statistics', label: 'Statistics', icon: BarChart3, description: 'Platform overview & metrics' },
  { id: 'invites', label: 'Invites', icon: Mail, description: 'Manage invitation requests' },
  { id: 'featured', label: 'Featured', icon: Star, description: 'Manage featured posts' },
  { id: 'users', label: 'Users', icon: Users, description: 'Manage user accounts' },
  { id: 'moderation', label: 'Moderation', icon: FileText, description: 'Review pending posts' },
  { id: 'bots', label: 'Reports', icon: Bot, description: 'Bot-flagged accounts' },
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
    <div className="min-h-[calc(100vh-60px)] -mx-4 md:-mx-4">

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

      {/* ── Desktop: sidebar layout ── */}
      <div className="hidden lg:flex">
        {/* Sidebar */}
        <aside className="w-64 xl:w-72 shrink-0 border-r border-border bg-card min-h-[calc(100vh-60px)] sticky top-[60px] self-start flex flex-col">
          {/* Brand */}
          <div className="px-5 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-[#52b274] to-[#3d9659] flex items-center justify-center shadow">
                <ShieldCheck className="size-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold leading-none">Control Panel</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Admin Dashboard</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-3 space-y-0.5">
            {NAV_ITEMS.map(({ id, label, icon: Icon, description }) => {
              const isActive = activeTab === id
              const hasBadge = id === 'invites' && pendingInvites > 0
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group relative',
                    isActive
                      ? 'bg-[#52b274] text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  <Icon className={cn('size-4 shrink-0 transition-colors', isActive ? 'text-white' : 'text-muted-foreground/70 group-hover:text-foreground')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{label}</span>
                      {hasBadge && (
                        <Badge
                          className={cn(
                            'text-[10px] h-5 min-w-5 px-1.5 rounded-full font-bold',
                            isActive ? 'bg-white/25 text-white hover:bg-white/30' : 'bg-red-500 text-white hover:bg-red-600'
                          )}
                        >
                          {pendingInvites}
                        </Badge>
                      )}
                      {isActive && !hasBadge && <ChevronRight className="size-3.5 text-white/60 shrink-0" />}
                    </div>
                    {!isActive && (
                      <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">{description}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border">
            <p className="text-[11px] text-muted-foreground">
              Logged in as <span className="font-semibold text-foreground">{userData?.username || 'Admin'}</span>
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Breadcrumb bar */}
          <div className="px-6 py-3.5 border-b border-border bg-background/80 backdrop-blur sticky top-[60px] z-10">
            <div className="flex items-center gap-1.5 text-sm">
              <ShieldCheck className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Admin</span>
              <ChevronRight className="size-3.5 text-muted-foreground/50" />
              <span className="font-semibold text-foreground">{activeItem.label}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{activeItem.description}</p>
          </div>

          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile content */}
      <div className="lg:hidden p-4">
        {renderContent()}
      </div>
    </div>
  )
}
