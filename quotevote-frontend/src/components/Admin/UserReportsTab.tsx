'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import moment from 'moment'
import { AlertCircle, Loader2, Flag, ShieldOff, Search, User } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { GET_USER_REPORTS, GET_USERS } from '@/graphql/queries'
import { DISABLE_USER } from '@/graphql/mutations'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'
import type { AdminUser, GetUsersResponse, UserReport } from '@/types/admin'

function ReasonBadge({ reason }: { reason: string }) {
  return (
    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border bg-muted/50 text-muted-foreground border-border capitalize">
      {reason.replace(/_/g, ' ')}
    </span>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls = {
    low:      'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
    medium:   'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
    high:     'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800',
    critical: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800',
  }[severity] ?? 'bg-muted text-muted-foreground border-border'

  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${cls}`}>
      {severity}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls = {
    pending:   'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
    reviewed:  'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
    resolved:  'bg-[#52b274]/10 text-[#52b274] border-[#52b274]/20',
    dismissed: 'bg-muted text-muted-foreground border-border',
  }[status] ?? 'bg-muted text-muted-foreground border-border'

  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${cls}`}>
      {status}
    </span>
  )
}

export default function UserReportsTab() {
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  // All users — used for the lookup list + mapping reporter IDs → usernames
  const { data: usersData, loading: usersLoading } = useQuery<GetUsersResponse>(GET_USERS, {
    variables: { limit: 1000, offset: 0 },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  })

  // Reports for the selected user (skipped until one is chosen)
  const { data, loading: reportsLoading, error, refetch } = useQuery<{
    getUserReports: UserReport[]
  }>(GET_USER_REPORTS, {
    variables: { userId: selectedUser?._id },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    skip: !selectedUser,
  })

  const [disableUser, { loading: disabling }] = useMutation(DISABLE_USER)

  const handleDisable = async () => {
    if (!selectedUser) return
    try {
      await disableUser({ variables: { userId: selectedUser._id } })
      toast.success(`User @${selectedUser.username} has been disabled`)
      refetch()
    } catch (err) {
      toast.error(replaceGqlError(err instanceof Error ? err.message : 'Failed to disable user'))
    }
  }

  const allUsers = usersData?.users ?? []
  const userMap = new Map<string, AdminUser>(allUsers.map((u) => [u._id, u]))

  const filteredUsers = search.trim()
    ? allUsers.filter((u) =>
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.name?.toLowerCase().includes(search.toLowerCase())
      )
    : allUsers

  const reports = data?.getUserReports ?? []

  return (
    <div className="space-y-5">
      {/* ── User lookup panel ── */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <h3 className="text-sm font-semibold">User Lookup</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a user to view reports filed against them
          </p>
        </div>

        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by username or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {usersLoading ? (
            <div className="space-y-1.5">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-9 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
              {filteredUsers.slice(0, 30).map((user) => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => setSelectedUser(user)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedUser?._id === user._id
                      ? 'bg-[#52b274]/10 text-[#52b274]'
                      : 'hover:bg-muted/60 text-foreground'
                  }`}
                >
                  <div className="size-6 rounded-full bg-[#52b274]/10 flex items-center justify-center text-[10px] font-bold text-[#52b274] shrink-0">
                    {(user.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">@{user.username}</span>
                  {user.name && (
                    <span className="text-xs text-muted-foreground ml-auto truncate max-w-[120px]">
                      {user.name}
                    </span>
                  )}
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No users match</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── No user selected yet ── */}
      {!selectedUser && (
        <div className="rounded-xl border border-border/60 bg-card flex flex-col items-center justify-center py-16 gap-3">
          <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
            <Flag className="size-7 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">No user selected</p>
            <p className="text-xs text-muted-foreground mt-1">
              Pick a user above to view their reports
            </p>
          </div>
        </div>
      )}

      {/* ── Reports panel ── */}
      {selectedUser && (
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="size-4 text-red-500" />
              <span className="text-sm font-semibold">
                Reports against <span className="text-foreground">@{selectedUser.username}</span>
              </span>
            </div>
            {!reportsLoading && !error && (
              <span className="text-xs text-muted-foreground">
                {reports.length} report{reports.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-5">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="size-4" />
                <p className="text-sm font-semibold">Error loading reports</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
            </div>
          )}

          {/* Loading */}
          {reportsLoading && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          )}

          {/* Empty */}
          {!reportsLoading && !error && reports.length === 0 && (
            <div className="rounded-xl border border-border/60 bg-card flex flex-col items-center justify-center py-12 gap-3">
              <div className="size-12 rounded-2xl bg-[#52b274]/10 flex items-center justify-center">
                <Flag className="size-6 text-[#52b274]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">No reports</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No reports have been filed against @{selectedUser.username}
                </p>
              </div>
            </div>
          )}

          {/* Reports table */}
          {!reportsLoading && !error && reports.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reported By</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Severity</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {reports.map((report) => {
                      const reporter = userMap.get(report._reporterId)
                      return (
                        <tr key={report._id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <User className="size-3.5 text-muted-foreground shrink-0" />
                              <span className="text-sm font-medium">
                                {reporter
                                  ? `@${reporter.username}`
                                  : `…${report._reporterId.slice(-6)}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <ReasonBadge reason={report.reason} />
                          </td>
                          <td className="px-5 py-3.5">
                            <SeverityBadge severity={report.severity} />
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={report.status} />
                          </td>
                          <td className="px-5 py-3.5 text-sm text-muted-foreground">
                            {moment(report.createdAt).format('MMM DD, YYYY')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border/40">
                {reports.map((report) => {
                  const reporter = userMap.get(report._reporterId)
                  return (
                    <div key={report._id} className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                          <User className="size-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {reporter
                              ? `@${reporter.username}`
                              : `…${report._reporterId.slice(-6)}`}
                          </span>
                        </div>
                        <ReasonBadge reason={report.reason} />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <SeverityBadge severity={report.severity} />
                        <StatusBadge status={report.status} />
                        <span className="text-xs text-muted-foreground ml-auto">
                          {moment(report.createdAt).format('MMM DD, YYYY')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer with disable action */}
              <div className="px-5 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {reports.length} report{reports.length !== 1 ? 's' : ''} against @{selectedUser.username}
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      disabled={disabling}
                      className="border border-red-200 bg-transparent text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950 gap-1"
                    >
                      <ShieldOff className="size-3" />
                      Disable User
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disable @{selectedUser.username}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will prevent them from logging in. The action can be reversed later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDisable}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {disabling && <Loader2 className="mr-1 size-3 animate-spin" />}
                        Disable User
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
