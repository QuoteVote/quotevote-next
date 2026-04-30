'use client'

import { useQuery, useMutation } from '@apollo/client/react'
import { AlertCircle, Users, Award } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
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
      await updateUser({ variables: { user: { _id: user._id, contributorBadge: !user.contributorBadge } } })
      toast.success(
        `Contributor badge ${user.contributorBadge ? 'removed from' : 'added to'} @${user.username}`
      )
      refetch()
    } catch (err) {
      toast.error(replaceGqlError(err instanceof Error ? err.message : 'Failed to update user'))
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-5">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="size-4" />
          <p className="text-sm font-semibold">Error loading users</p>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {error.message?.includes('Authentication') ? 'Please log in to manage users.' : error.message}
        </p>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    )
  }

  const users = data.users || []
  const contributorCount = users.filter((u) => u.contributorBadge).length

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-[#52b274]/10 flex items-center justify-center">
              <Users className="size-4 text-[#52b274]" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Award className="size-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums">{contributorCount}</p>
              <p className="text-xs text-muted-foreground">Contributors</p>
            </div>
          </div>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card flex flex-col items-center justify-center py-16 gap-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center">
            <Users className="size-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No users found</p>
            <p className="text-xs text-muted-foreground mt-1">Users will appear once they join</p>
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contributor Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-[#52b274]/10 flex items-center justify-center text-xs font-bold text-[#52b274]">
                          {(user.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold">@{user.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{user.name || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-3">
                        <Switch
                          checked={!!user.contributorBadge}
                          onCheckedChange={() => handleToggle(user)}
                          aria-label="Toggle contributor badge"
                        />
                        {user.contributorBadge && (
                          <Badge className="bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-800 hover:bg-amber-500/20 gap-1 text-xs">
                            <Award className="size-3" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border/40">
            {users.map((user) => (
              <div key={user._id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-full bg-[#52b274]/10 flex items-center justify-center text-xs font-bold text-[#52b274] shrink-0">
                    {(user.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">@{user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.name || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">Contributor</span>
                  <Switch
                    checked={!!user.contributorBadge}
                    onCheckedChange={() => handleToggle(user)}
                    aria-label="Toggle contributor badge"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
