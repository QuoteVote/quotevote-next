'use client'

import { useQuery, useMutation } from '@apollo/client/react'
import moment from 'moment'
import { AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import Avatar from '@/components/Avatar'
import { GET_USER_REPORTS } from '@/graphql/queries'
import { DISABLE_USER } from '@/graphql/mutations'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'
import type { UserReport } from '@/types/admin'

export default function UserReportsTab() {
  const { data, loading, error, refetch } = useQuery<{
    getUserReports: UserReport[]
  }>(GET_USER_REPORTS, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  })

  const [disableUser, { loading: disableLoading }] = useMutation(DISABLE_USER)

  const handleDisable = async (userId: string, username: string) => {
    try {
      await disableUser({ variables: { userId } })
      toast.success(`User @${username} has been disabled`)
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable user'
      toast.error(replaceGqlError(message))
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">User Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message?.includes('Authentication')
                ? 'Please log in to view reports.'
                : `Error loading reports: ${error.message}`}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">User Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const reports = data.getUserReports || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">User Reports ({reports.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-medium">No user reports</p>
            <p className="text-sm text-muted-foreground mt-1">
              Reports will appear here when users are reported
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reported User</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={report.reportedUser?.avatar}
                            alt={report.reportedUser?.username || ''}
                            fallback={report.reportedUser?.username?.charAt(0) || 'U'}
                            size={32}
                          />
                          <span className="text-sm font-medium">
                            @{report.reportedUser?.username}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          @{report.reportedBy?.username}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {report.reason?.replace(/_/g, ' ') || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {moment(report.created).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => refetch()}>
                            Dismiss
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={disableLoading}
                              >
                                {disableLoading && (
                                  <Loader2 className="mr-1 size-3 animate-spin" />
                                )}
                                Disable
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Disable @{report.reportedUser?.username}?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will prevent them from logging in. This action can be reversed later.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDisable(
                                      report.reportedUser?._id,
                                      report.reportedUser?.username
                                    )
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Disable User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {reports.map((report) => (
                <div key={report._id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={report.reportedUser?.avatar}
                        alt={report.reportedUser?.username || ''}
                        fallback={report.reportedUser?.username?.charAt(0) || 'U'}
                        size={32}
                      />
                      <span className="text-sm font-medium">
                        @{report.reportedUser?.username}
                      </span>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {report.reason?.replace(/_/g, ' ') || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Reported by @{report.reportedBy?.username}
                    </span>
                    <span className="text-muted-foreground">
                      {moment(report.created).fromNow()}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => refetch()}>
                      Dismiss
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="flex-1" disabled={disableLoading}>
                          Disable
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Disable @{report.reportedUser?.username}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will prevent them from logging in.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleDisable(
                                report.reportedUser?._id,
                                report.reportedUser?.username
                              )
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Disable User
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
