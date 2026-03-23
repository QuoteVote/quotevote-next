'use client'

import { useState, useCallback } from 'react'
import { useMutation } from '@apollo/client/react'
import moment from 'moment'
import { Search, Loader2, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  onRefresh: () => void
}

function getStatusLabel(status: string) {
  switch (Number(status)) {
    case 1:
      return 'Pending'
    case 2:
      return 'Declined'
    case 4:
      return 'Accepted'
    default:
      return 'Unknown'
  }
}

function getStatusVariant(status: string): 'outline' | 'default' | 'destructive' {
  switch (Number(status)) {
    case 1:
      return 'outline'
    case 2:
      return 'destructive'
    case 4:
      return 'default'
    default:
      return 'outline'
  }
}

function ActionButtons({
  status,
  id,
  onActionComplete,
}: {
  status: string
  id: string
  onActionComplete: () => void
}) {
  const [updateStatus, { loading }] = useMutation(UPDATE_USER_INVITE_STATUS)

  const handleAction = async (inviteStatus: number, successMessage: string) => {
    try {
      await updateStatus({
        variables: { userId: id, inviteStatus: String(inviteStatus) },
      })
      toast.success(successMessage)
      onActionComplete()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status'
      toast.error(replaceGqlError(message))
    }
  }

  switch (Number(status)) {
    case 1: // Pending
      return (
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={loading}>
                Decline
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Decline invitation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will decline the user&apos;s invitation request.
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
          >
            {loading && <Loader2 className="mr-1 size-3 animate-spin" />}
            Accept
          </Button>
        </div>
      )
    case 2: // Declined
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction(1, 'Reset to pending')}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-1 size-3 animate-spin" />}
          Reset
        </Button>
      )
    case 4: // Accepted
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction(4, 'Invitation resent')}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-1 size-3 animate-spin" />}
          Resend
        </Button>
      )
    default:
      return null
  }
}

export default function UserInviteRequestsTab({
  data,
  onRefresh,
}: UserInviteRequestsTabProps) {
  const [emailFilter, setEmailFilter] = useState('')
  const [sortKey, setSortKey] = useState<'email' | 'joined' | 'status'>('joined')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  const handleSort = (key: 'email' | 'joined' | 'status') => {
    setSortDir(sortKey === key && sortDir === 'asc' ? 'desc' : 'asc')
    setSortKey(key)
  }

  const handleActionComplete = useCallback(() => {
    onRefresh()
  }, [onRefresh])

  const filtered = data.filter((r) =>
    r.email.toLowerCase().includes(emailFilter.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    let aVal: string | number
    let bVal: string | number
    switch (sortKey) {
      case 'email':
        aVal = a.email.toLowerCase()
        bVal = b.email.toLowerCase()
        break
      case 'joined':
        aVal = new Date(a.joined).getTime()
        bVal = new Date(b.joined).getTime()
        break
      case 'status':
        aVal = Number(a.status)
        bVal = Number(b.status)
        break
      default:
        return 0
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const paginated = sorted.slice(page * rowsPerPage, (page + 1) * rowsPerPage)
  const totalPages = Math.ceil(sorted.length / rowsPerPage)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          User Invitation Requests ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={emailFilter}
              onChange={(e) => {
                setEmailFilter(e.target.value)
                setPage(0)
              }}
              className="pl-9"
            />
          </div>
        )}

        {paginated.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-medium">
              {emailFilter ? 'No results match your search' : 'No invite requests'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {emailFilter
                ? 'Try a different search term'
                : 'Invite requests will appear here'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Email <ArrowUpDown className="size-3" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort('joined')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Joined <ArrowUpDown className="size-3" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Status <ArrowUpDown className="size-3" />
                      </span>
                    </TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell className="font-medium">{row.email}</TableCell>
                      <TableCell>
                        {moment(row.joined).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(row.status)}>
                          {getStatusLabel(row.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ActionButtons
                          status={row.status}
                          id={row._id}
                          onActionComplete={handleActionComplete}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {paginated.map((row) => (
                <div key={row._id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium truncate ml-2">
                      {row.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Joined</span>
                    <span className="text-sm">
                      {moment(row.joined).format('MMM DD, YYYY')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={getStatusVariant(row.status)}>
                      {getStatusLabel(row.status)}
                    </Badge>
                  </div>
                  <div className="pt-1">
                    <ActionButtons
                      status={row.status}
                      id={row._id}
                      onActionComplete={handleActionComplete}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, sorted.length)} of{' '}
                  {sorted.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
