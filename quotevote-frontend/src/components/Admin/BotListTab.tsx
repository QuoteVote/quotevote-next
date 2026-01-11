'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import moment from 'moment'
import { useResponsive } from '@/hooks/useResponsive'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import Avatar from '@/components/Avatar'
import { GET_BOT_REPORTED_USERS } from '@/graphql/queries'
import { DISABLE_USER, ENABLE_USER } from '@/graphql/mutations'
import type {
  BotReportedUser,
  GetBotReportedUsersResponse,
  GetBotReportedUsersVariables,
  SortByOption,
} from '@/types/admin'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BotListTab() {
  const { isSmallScreen } = useResponsive()
  const [sortBy, setSortBy] = useState<SortByOption>('botReports')

  const { data, loading, error, refetch } = useQuery<
    GetBotReportedUsersResponse,
    GetBotReportedUsersVariables
  >(GET_BOT_REPORTED_USERS, {
    variables: {
      sortBy,
      limit: 100,
    },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  })

  const [disableUser, { loading: disableLoading }] = useMutation(DISABLE_USER)
  const [enableUser, { loading: enableLoading }] = useMutation(ENABLE_USER)

  const handleDisableUser = async (userId: string) => {
    try {
      await disableUser({
        variables: { userId },
      })
      refetch()
    } catch (err) {
      // Error handling is done by Apollo Client
      if (process.env.NODE_ENV === 'development') {
         
        console.error('Error disabling user:', err)
      }
    }
  }

  const handleEnableUser = async (userId: string) => {
    try {
      await enableUser({
        variables: { userId },
      })
      refetch()
    } catch (err) {
      // Error handling is done by Apollo Client
      if (process.env.NODE_ENV === 'development') {
         
        console.error('Error enabling user:', err)
      }
    }
  }

  // Error states
  if (error) {
    if (error.message?.includes('Authentication required')) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Bot Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                Please log in to view bot reports.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )
    }
    if (error.message?.includes('Admin access required')) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Bot Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Admin Access Required</AlertTitle>
              <AlertDescription>
                Admin access is required to view bot reports.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bot Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Error loading bot reports: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bot Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const reportedUsers = data.getBotReportedUsers || []

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-base font-medium mb-2">No bot reports found</p>
      <p className="text-sm text-muted-foreground">
        Bot reports will appear here when users are reported
      </p>
    </div>
  )

  // Helper function to get avatar source
  const getAvatarSrc = (avatar: BotReportedUser['avatar']): string | undefined => {
    if (typeof avatar === 'string') {
      return avatar
    }
    if (avatar && typeof avatar === 'object' && 'url' in avatar) {
      return typeof avatar.url === 'string' ? avatar.url : undefined
    }
    return undefined
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Bot Reports ({reportedUsers.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="sort-by" className="text-sm whitespace-nowrap">
              Sort By:
            </Label>
            <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as SortByOption)}>
              <SelectTrigger id="sort-by" className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="botReports">Most Reports</SelectItem>
                <SelectItem value="lastReportDate">Most Recent Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {reportedUsers.length === 0 ? (
          renderEmptyState()
        ) : isSmallScreen ? (
          // Mobile/Responsive List View
          <div className="space-y-4">
            {reportedUsers.map((user: BotReportedUser) => (
              <div
                key={user._id}
                className={cn(
                  'rounded-lg border p-4 space-y-3',
                  user.accountStatus === 'disabled' && 'bg-muted/50 opacity-75'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">User</span>
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={getAvatarSrc(user.avatar)}
                      alt={user.username}
                      fallback={user.name || user.username}
                      size={40}
                    />
                    <div className="text-right">
                      <p className="text-sm font-medium">{user.username}</p>
                      {user.name && (
                        <p className="text-xs text-muted-foreground">{user.name}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Email</span>
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Reports</span>
                  <Badge variant={user.botReports >= 5 ? 'destructive' : 'default'}>
                    {user.botReports}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Last Report</span>
                  <div className="text-right">
                    <p className="text-sm">
                      {user.lastBotReportDate
                        ? moment(user.lastBotReportDate).format('MMM D, YYYY')
                        : 'N/A'}
                    </p>
                    {user.lastBotReportDate && (
                      <p className="text-xs text-muted-foreground">
                        {moment(user.lastBotReportDate).fromNow()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <Badge
                    variant={user.accountStatus === 'active' ? 'default' : 'secondary'}
                    className="font-medium"
                  >
                    {user.accountStatus === 'active' ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                <div className="pt-2">
                  {user.accountStatus === 'active' ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDisableUser(user._id)}
                      disabled={disableLoading}
                    >
                      Disable
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => handleEnableUser(user._id)}
                      disabled={enableLoading}
                    >
                      Enable
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Desktop Table View
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-sm">User</th>
                  <th className="text-left p-3 font-medium text-sm">Email</th>
                  <th className="text-center p-3 font-medium text-sm">Reports</th>
                  <th className="text-left p-3 font-medium text-sm">Last Report</th>
                  <th className="text-left p-3 font-medium text-sm">Status</th>
                  <th className="text-right p-3 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reportedUsers.map((user: BotReportedUser) => (
                  <tr
                    key={user._id}
                    className={cn(
                      'border-b hover:bg-muted/50',
                      user.accountStatus === 'disabled' && 'bg-muted/30 opacity-75'
                    )}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={getAvatarSrc(user.avatar)}
                          alt={user.username}
                          fallback={user.name || user.username}
                          size={40}
                        />
                        <div>
                          <p className="text-sm font-medium">{user.username}</p>
                          {user.name && (
                            <p className="text-xs text-muted-foreground">{user.name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{user.email}</span>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={user.botReports >= 5 ? 'destructive' : 'default'}>
                        {user.botReports}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="text-sm">
                          {user.lastBotReportDate
                            ? moment(user.lastBotReportDate).format('MMM D, YYYY')
                            : 'N/A'}
                        </p>
                        {user.lastBotReportDate && (
                          <p className="text-xs text-muted-foreground">
                            {moment(user.lastBotReportDate).fromNow()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={user.accountStatus === 'active' ? 'default' : 'secondary'}
                        className="font-medium"
                      >
                        {user.accountStatus === 'active' ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {user.accountStatus === 'active' ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDisableUser(user._id)}
                          disabled={disableLoading}
                        >
                          Disable
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleEnableUser(user._id)}
                          disabled={enableLoading}
                        >
                          Enable
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

