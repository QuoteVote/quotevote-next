'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import moment from 'moment'
import { AlertCircle, Bot, ShieldOff, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GET_BOT_REPORTED_USERS } from '@/graphql/queries'
import { DISABLE_USER, ENABLE_USER } from '@/graphql/mutations'
import { cn } from '@/lib/utils'
import type {
  GetBotReportedUsersResponse,
  GetBotReportedUsersVariables,
  SortByOption,
} from '@/types/admin'


export default function BotListTab() {
  const [sortBy, setSortBy] = useState<SortByOption>('botReports')

  const { data, loading, error, refetch } = useQuery<
    GetBotReportedUsersResponse,
    GetBotReportedUsersVariables
  >(GET_BOT_REPORTED_USERS, {
    variables: { sortBy, limit: 100 },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  })

  const [disableUser, { loading: disableLoading }] = useMutation(DISABLE_USER)
  const [enableUser, { loading: enableLoading }] = useMutation(ENABLE_USER)

  const handleDisable = async (userId: string) => {
    try {
      await disableUser({ variables: { userId } })
      toast.success('User disabled successfully')
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disable user')
    }
  }

  const handleEnable = async (userId: string) => {
    try {
      await enableUser({ variables: { userId } })
      toast.success('User enabled successfully')
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to enable user')
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-5">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="size-4" />
          <p className="text-sm font-semibold">Error loading bot reports</p>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {error.message?.includes('Authentication')
            ? 'Please log in to view bot reports.'
            : error.message?.includes('Admin')
              ? 'Admin access is required to view bot reports.'
              : error.message}
        </p>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    )
  }

  const reportedUsers = data.getBotReportedUsers || []
  const disabledCount = reportedUsers.filter((u) => u.accountStatus === 'disabled').length
  const activeCount = reportedUsers.filter((u) => u.accountStatus === 'active').length

  return (
    <div className="space-y-5">
      {/* Summary + sort */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-red-500" />
            <span className="text-sm text-muted-foreground">{activeCount} flagged</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-muted-foreground/40" />
            <span className="text-sm text-muted-foreground">{disabledCount} disabled</span>
          </div>
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortByOption)}>
          <SelectTrigger className="w-[160px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="botReports">Most Reports</SelectItem>
            <SelectItem value="lastReportDate">Most Recent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {reportedUsers.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card flex flex-col items-center justify-center py-16 gap-3">
          <div className="size-14 rounded-2xl bg-[#52b274]/10 flex items-center justify-center">
            <Bot className="size-7 text-[#52b274]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">No bot reports</p>
            <p className="text-xs text-muted-foreground mt-1">Bot-flagged accounts will appear here</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reports</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Report</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {reportedUsers.map((user) => {
                  const isDisabled = user.accountStatus === 'disabled'
                  const isHighRisk = user.botReports >= 5
                  return (
                    <tr
                      key={user._id}
                      className={cn(
                        'transition-colors',
                        isDisabled ? 'opacity-60 bg-muted/10' : 'hover:bg-muted/20'
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            'size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                            isHighRisk ? 'bg-red-500/15 text-red-500' : 'bg-muted text-muted-foreground'
                          )}>
                            {(user.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{user.username}</p>
                            {user.name && <p className="text-xs text-muted-foreground">{user.name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={cn(
                          'inline-flex items-center justify-center min-w-[2rem] text-xs font-bold px-2 py-0.5 rounded-full',
                          isHighRisk
                            ? 'bg-red-500/10 text-red-600 border border-red-200 dark:border-red-800'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-800'
                        )}>
                          {user.botReports}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {user.lastBotReportDate ? (
                          <div>
                            <p className="text-sm">{moment(user.lastBotReportDate).format('MMM D, YYYY')}</p>
                            <p className="text-xs text-muted-foreground">{moment(user.lastBotReportDate).fromNow()}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border',
                          isDisabled
                            ? 'bg-muted/50 text-muted-foreground border-border'
                            : 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800'
                        )}>
                          {isDisabled
                            ? <><ShieldOff className="size-3" />Disabled</>
                            : <><Bot className="size-3" />Flagged</>
                          }
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isDisabled ? (
                          <Button
                            size="sm"
                            onClick={() => handleEnable(user._id)}
                            disabled={enableLoading}
                            className="bg-[#52b274] hover:bg-[#3d9659] text-white gap-1"
                          >
                            <ShieldCheck className="size-3" />
                            Enable
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleDisable(user._id)}
                            disabled={disableLoading}
                            className="border border-red-200 bg-transparent text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950 gap-1"
                          >
                            <ShieldOff className="size-3" />
                            Disable
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border/40">
            {reportedUsers.map((user) => {
              const isDisabled = user.accountStatus === 'disabled'
              const isHighRisk = user.botReports >= 5
              return (
                <div
                  key={user._id}
                  className={cn('p-4 space-y-3', isDisabled && 'opacity-60')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        'size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                        isHighRisk ? 'bg-red-500/15 text-red-500' : 'bg-muted text-muted-foreground'
                      )}>
                        {(user.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{user.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <span className={cn(
                      'inline-flex items-center justify-center min-w-[1.75rem] text-xs font-bold px-2 py-0.5 rounded-full shrink-0',
                      isHighRisk
                        ? 'bg-red-500/10 text-red-600 border border-red-200 dark:border-red-800'
                        : 'bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-800'
                    )}>
                      {user.botReports}
                    </span>
                  </div>
                  {user.lastBotReportDate && (
                    <p className="text-xs text-muted-foreground">
                      Last reported {moment(user.lastBotReportDate).fromNow()}
                    </p>
                  )}
                  {isDisabled ? (
                    <Button
                      size="sm"
                      onClick={() => handleEnable(user._id)}
                      disabled={enableLoading}
                      className="w-full bg-[#52b274] hover:bg-[#3d9659] text-white"
                    >
                      Enable
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleDisable(user._id)}
                      disabled={disableLoading}
                      className="w-full border border-red-200 bg-transparent text-red-600 hover:bg-red-50 dark:border-red-900"
                    >
                      Disable
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
