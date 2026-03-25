'use client'

import { useQuery, useMutation } from '@apollo/client/react'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GET_USERS } from '@/graphql/queries'
import { UPDATE_USER } from '@/graphql/mutations'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'
import type { AdminUser, GetUsersResponse } from '@/types/admin'

export default function UserManagementTab() {
  const { data, loading, error, refetch } = useQuery<GetUsersResponse>(GET_USERS, {
    variables: { limit: 100, offset: 0 },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  })

  const [updateUser] = useMutation(UPDATE_USER)

  const handleToggle = async (user: AdminUser) => {
    try {
      await updateUser({
        variables: {
          user: {
            _id: user._id,
            contributorBadge: !user.contributorBadge,
          },
        },
      })
      toast.success(
        `Contributor badge ${user.contributorBadge ? 'removed from' : 'added to'} @${user.username}`
      )
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user'
      toast.error(replaceGqlError(message))
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message?.includes('Authentication')
                ? 'Please log in to manage users.'
                : `Error loading users: ${error.message}`}
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
          <CardTitle className="text-base">User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const users = data.users || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">User Management ({users.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-medium">No users found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Users will appear once they join.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center">Contributor Badge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">@{user.username}</TableCell>
                      <TableCell>{user.name || '—'}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={!!user.contributorBadge}
                            onCheckedChange={() => handleToggle(user)}
                            aria-label="Toggle contributor badge"
                          />
                          {user.contributorBadge && (
                            <Badge variant="default" className="text-xs">Active</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {users.map((user) => (
                <div key={user._id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">@{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.name || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Contributor</span>
                      <Switch
                        checked={!!user.contributorBadge}
                        onCheckedChange={() => handleToggle(user)}
                        aria-label="Toggle contributor badge"
                      />
                    </div>
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
