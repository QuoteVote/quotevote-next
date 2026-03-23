'use client'

import { Suspense } from 'react'
import { useQuery } from '@apollo/client/react'
import { ShieldCheck, AlertCircle } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { USER_INVITE_REQUESTS } from '@/graphql/queries'
import { useAppStore } from '@/store/useAppStore'
import type { UserInviteRequestsResponse } from '@/types/admin'
import type { SettingsUserData } from '@/types/settings'

import BotListTab from '@/components/Admin/BotListTab'
import UserInviteRequestsTab from '@/components/Admin/UserInviteRequestsTab'
import UserReportsTab from '@/components/Admin/UserReportsTab'
import PostModerationTab from '@/components/Admin/PostModerationTab'
import FeaturedPostsTab from '@/components/Admin/FeaturedPostsTab'
import UserManagementTab from '@/components/Admin/UserManagementTab'
import StatisticsTab from '@/components/Admin/StatisticsTab'

function TabSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  )
}

export default function ControlPanelClient() {
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
      <div className="py-6">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Admin access is required to view this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div className="py-6 space-y-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-6" />
          <h1 className="text-2xl font-bold tracking-tight">Control Panel</h1>
        </div>
        <TabSkeleton />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="py-6 space-y-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-6" />
          <h1 className="text-2xl font-bold tracking-tight">Control Panel</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Error loading data: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const inviteData = data?.userInviteRequests || []

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-6" />
        <h1 className="text-2xl font-bold tracking-tight">Control Panel</h1>
      </div>

      <Tabs defaultValue="invites" className="w-full">
        <TabsList className="w-full flex overflow-x-auto">
          <TabsTrigger value="invites" className="flex-1 text-xs sm:text-sm">
            Invites
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex-1 text-xs sm:text-sm">
            Statistics
          </TabsTrigger>
          <TabsTrigger value="featured" className="flex-1 text-xs sm:text-sm">
            Featured
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-1 text-xs sm:text-sm">
            Users
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex-1 text-xs sm:text-sm">
            Moderation
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex-1 text-xs sm:text-sm">
            Reports
          </TabsTrigger>
          <TabsTrigger value="bots" className="flex-1 text-xs sm:text-sm">
            Bots
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invites" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <UserInviteRequestsTab data={inviteData} onRefresh={refetch} />
          </Suspense>
        </TabsContent>

        <TabsContent value="statistics" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <StatisticsTab inviteData={inviteData} />
          </Suspense>
        </TabsContent>

        <TabsContent value="featured" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <FeaturedPostsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <UserManagementTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="moderation" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <PostModerationTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <UserReportsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="bots" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <BotListTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
