'use client'

import { useQuery, useMutation } from '@apollo/client/react'
import moment from 'moment'
import { Mail, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { USER_INVITE_REQUESTS } from '@/graphql/queries'
import { UPDATE_USER_INVITE_STATUS } from '@/graphql/mutations'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'
import type { InviteRequest, UserInviteRequestsResponse } from '@/types/admin'

function getStatusLabel(status: string) {
  switch (Number(status)) {
    case 1: return 'Pending'
    case 2: return 'Declined'
    case 4: return 'Accepted'
    default: return 'New'
  }
}

function getStatusVariant(status: string): 'outline' | 'default' | 'destructive' {
  switch (Number(status)) {
    case 1: return 'outline'
    case 2: return 'destructive'
    case 4: return 'default'
    default: return 'outline'
  }
}

function InviteActionButton({
  invite,
  onComplete,
}: {
  invite: InviteRequest
  onComplete: () => void
}) {
  const [updateStatus, { loading }] = useMutation(UPDATE_USER_INVITE_STATUS)

  const handleAction = async (newStatus: number, message: string) => {
    try {
      await updateStatus({
        variables: { userId: invite._id, inviteStatus: String(newStatus) },
      })
      toast.success(message)
      onComplete()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update'
      toast.error(replaceGqlError(msg))
    }
  }

  const statusNum = Number(invite.status)

  if (statusNum === 1) {
    // Pending — show Accept / Decline
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
              <AlertDialogTitle>Decline this invitation?</AlertDialogTitle>
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
          onClick={() => handleAction(4, 'Invitation accepted')}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-1 size-3 animate-spin" />}
          Accept
        </Button>
      </div>
    )
  }

  if (statusNum === 4) {
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
  }

  if (statusNum === 2) {
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
  }

  return null
}

function InviteTable({
  invites,
  onRefresh,
}: {
  invites: InviteRequest[]
  onRefresh: () => void
}) {
  if (invites.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="mx-auto size-10 text-muted-foreground mb-3" />
        <p className="font-medium">No invite requests</p>
        <p className="text-sm text-muted-foreground mt-1">
          Invite requests will appear here
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite, idx) => (
              <TableRow key={invite._id}>
                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="font-medium">{invite.email}</TableCell>
                <TableCell className="text-sm">
                  {invite.joined ? moment(invite.joined).format('MMM DD, YYYY') : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(invite.status)}>
                    {getStatusLabel(invite.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <InviteActionButton invite={invite} onComplete={onRefresh} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {invites.map((invite) => (
          <div key={invite._id} className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate">{invite.email}</span>
              <Badge variant={getStatusVariant(invite.status)}>
                {getStatusLabel(invite.status)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {invite.joined ? moment(invite.joined).format('MMM DD, YYYY') : '—'}
            </p>
            <div className="pt-1">
              <InviteActionButton invite={invite} onComplete={onRefresh} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default function ManageInvitesClient() {
  const { data, loading, error, refetch } = useQuery<UserInviteRequestsResponse>(
    USER_INVITE_REQUESTS,
    {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    }
  )

  if (error && !data) {
    return (
      <div className="py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Mail className="size-6" />
          <h1 className="text-2xl font-bold tracking-tight">Manage Invites</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const invites = data?.userInviteRequests || []
  const sentInvites = invites.filter((i) => Number(i.status) === 4)
  const receivedRequests = invites.filter((i) => Number(i.status) !== 4)

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Mail className="size-6" />
        <h1 className="text-2xl font-bold tracking-tight">Manage Invites</h1>
      </div>

      {loading && !data ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="received">
          <TabsList>
            <TabsTrigger value="received">
              Received Requests ({receivedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent Invites ({sentInvites.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Received Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <InviteTable invites={receivedRequests} onRefresh={refetch} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sent Invites</CardTitle>
              </CardHeader>
              <CardContent>
                <InviteTable invites={sentInvites} onRefresh={refetch} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
