'use client'

import { useState, useCallback } from 'react'
import { useMutation } from '@apollo/client/react'
import moment from 'moment'
import { Search, Loader2, ArrowUpDown, Mail, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { UPDATE_USER_INVITE_STATUS } from '@/graphql/mutations'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'
import type { InviteRequest } from '@/types/admin'

interface UserInviteRequestsTabProps {
  data: InviteRequest[]
  onRefresh: () => Promise<void>
}

function getStatusConfig(status: string) {
  switch (Number(status)) {
    case 1:
      return { label: 'Pending', icon: Clock, className: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800' }
    case 2:
      return { label: 'Declined', icon: XCircle, className: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800' }
    case 4:
      return { label: 'Accepted', icon: CheckCircle2, className: 'bg-[#52b274]/10 text-[#52b274] border-[#52b274]/20' }
    default:
      return { label: 'Unknown', icon: Clock, className: 'bg-muted text-muted-foreground border-border' }
  }
}

function ActionButtons({
  status,
  id,
  onActionComplete,
}: {
  status: string
  id: string
  onActionComplete: () => Promise<void>
}) {
  const [updateStatus, { loading }] = useMutation(UPDATE_USER_INVITE_STATUS)

  const handleAction = async (inviteStatus: number, successMessage: string) => {
    try {
      await updateStatus({ variables: { userId: id, inviteStatus: String(inviteStatus) } })
      await onActionComplete()
      toast.success(successMessage)
    } catch (err) {
      toast.error(replaceGqlError(err instanceof Error ? err.message : 'Failed to update status'))
    }
  }

  switch (Number(status)) {
    case 1:
      return (
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading} className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:hover:bg-red-950">
                Decline
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Decline invitation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will decline the user&apos;s invitation request. They can be reset to pending later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleAction(2, 'Invitation declined')}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Decline
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            size="sm"
            onClick={() => handleAction(4, 'Invitation approved')}
            disabled={loading}
            className="bg-[#52b274] hover:bg-[#3d9659] text-white"
          >
            {loading ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
            Accept
          </Button>
        </div>
      )
    case 2:
      return (
        <Button variant="outline" size="sm" onClick={() => handleAction(1, 'Reset to pending')} disabled={loading}>
          {loading && <Loader2 className="mr-1 size-3 animate-spin" />}
          Reset
        </Button>
      )
    case 4:
      return (
        <Button variant="outline" size="sm" onClick={() => handleAction(4, 'Invitation resent')} disabled={loading}>
          {loading && <Loader2 className="mr-1 size-3 animate-spin" />}
          Resend
        </Button>
      )
    default:
      return null
  }
}

export default function UserInviteRequestsTab({ data, onRefresh }: UserInviteRequestsTabProps) {
  const [emailFilter, setEmailFilter] = useState('')
  const [sortKey, setSortKey] = useState<'email' | 'joined' | 'status'>('joined')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  const handleSort = (key: 'email' | 'joined' | 'status') => {
    setSortDir(sortKey === key && sortDir === 'asc' ? 'desc' : 'asc')
    setSortKey(key)
  }
  const handleActionComplete = useCallback(async () => { await onRefresh() }, [onRefresh])

  const filtered = data.filter((r) =>
    r.email.toLowerCase().includes(emailFilter.toLowerCase())
  )
  const sorted = [...filtered].sort((a, b) => {
    let aVal: string | number
    let bVal: string | number
    switch (sortKey) {
      case 'email': aVal = a.email.toLowerCase(); bVal = b.email.toLowerCase(); break
      case 'joined': aVal = new Date(a.joined).getTime(); bVal = new Date(b.joined).getTime(); break
      case 'status': aVal = Number(a.status); bVal = Number(b.status); break
      default: return 0
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })
  const paginated = sorted.slice(page * rowsPerPage, (page + 1) * rowsPerPage)
  const totalPages = Math.ceil(sorted.length / rowsPerPage)

  const pending = data.filter((r) => Number(r.status) === 1).length
  const accepted = data.filter((r) => Number(r.status) === 4).length
  const declined = data.filter((r) => Number(r.status) === 2).length

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', count: pending, color: 'text-amber-600', bg: 'bg-amber-500/10' },
          { label: 'Accepted', count: accepted, color: 'text-[#52b274]', bg: 'bg-[#52b274]/10' },
          { label: 'Declined', count: declined, color: 'text-red-600', bg: 'bg-red-500/10' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`rounded-xl border border-border/60 p-4 ${bg}`}>
            <p className={`text-2xl font-bold tabular-nums ${color}`}>{count}</p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div>
            <h3 className="text-sm font-semibold">Invitation Requests</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{data.length} total requests</p>
          </div>
          {data.length > 0 && (
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={emailFilter}
                onChange={(e) => { setEmailFilter(e.target.value); setPage(0) }}
                className="pl-8 h-8 text-sm"
              />
            </div>
          )}
        </div>

        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center">
              <Mail className="size-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{emailFilter ? 'No results found' : 'No invite requests'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {emailFilter ? 'Try a different search term' : 'Invite requests will appear here'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('email')}>
                      <span className="inline-flex items-center gap-1.5">Email <ArrowUpDown className="size-3" /></span>
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('joined')}>
                      <span className="inline-flex items-center gap-1.5">Joined <ArrowUpDown className="size-3" /></span>
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('status')}>
                      <span className="inline-flex items-center gap-1.5">Status <ArrowUpDown className="size-3" /></span>
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginated.map((row) => {
                    const cfg = getStatusConfig(row.status)
                    const StatusIcon = cfg.icon
                    return (
                      <tr key={row._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Mail className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium">{row.email}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">
                          {moment(row.joined).format('MMM DD, YYYY')}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.className}`}>
                            <StatusIcon className="size-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <ActionButtons status={row.status} id={row._id} onActionComplete={handleActionComplete} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border/40">
              {paginated.map((row) => {
                const cfg = getStatusConfig(row.status)
                const StatusIcon = cfg.icon
                return (
                  <div key={row._id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate mr-3">{row.email}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${cfg.className}`}>
                        <StatusIcon className="size-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{moment(row.joined).format('MMM DD, YYYY')}</p>
                    <ActionButtons status={row.status} id={row._id} onActionComplete={handleActionComplete} />
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/60 bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, sorted.length)} of {sorted.length}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
