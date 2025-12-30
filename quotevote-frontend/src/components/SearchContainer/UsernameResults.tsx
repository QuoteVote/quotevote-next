'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Avatar from '@/components/Avatar'
import type { UsernameResultsProps } from '@/types/components'
import { cn } from '@/lib/utils'

/**
 * UsernameResults Component
 * 
 * Displays a dropdown list of user search results with avatars and badges.
 * Shows loading state, error state, and empty state messages.
 * 
 * @param users - Array of user search results
 * @param loading - Whether the search is currently loading
 * @param error - Error object if search failed
 * @param onUserSelect - Callback when a user is selected
 * @param query - Current search query text
 */
export default function UsernameResults({
  users = [],
  loading = false,
  error = null,
  onUserSelect,
  query = '',
}: UsernameResultsProps) {
  // No results state
  if (!loading && (!users || users.length === 0) && query.length > 0) {
    return (
      <Card className="absolute top-full left-0 right-0 max-h-[300px] overflow-y-auto z-[1000] mt-1 shadow-lg">
        <CardContent className="p-4 text-center text-gray-500">
          <p className="text-sm">
            No users found matching &quot;{query}&quot;
          </p>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (loading) {
    return (
      <Card className="absolute top-full left-0 right-0 max-h-[300px] overflow-y-auto z-[1000] mt-1 shadow-lg">
        <CardContent className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <p className="text-sm text-gray-600 ml-2">Searching users...</p>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="absolute top-full left-0 right-0 max-h-[300px] overflow-y-auto z-[1000] mt-1 shadow-lg">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-destructive">
            Error searching users
          </p>
        </CardContent>
      </Card>
    )
  }

  // No users to display
  if (!users || users.length === 0) {
    return null
  }

  // Results list
  return (
    <Card className="absolute top-full left-0 right-0 max-h-[300px] overflow-y-auto z-[1000] mt-1 shadow-lg">
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {users.map((user) => {
            const handleClick = () => {
              if (onUserSelect) {
                onUserSelect(user)
              }
            }

            return (
              <Link
                key={user._id}
                href={`/${user.username}`}
                onClick={handleClick}
                className={cn(
                  'flex items-center gap-3 p-3',
                  'hover:bg-gray-50 transition-colors',
                  'cursor-pointer'
                )}
              >
                <div className="flex-shrink-0">
                  <Avatar
                    src={user.avatar}
                    alt={user.name || user.username}
                    size={40}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      @{user.username}
                    </p>
                    {user.contributorBadge && (
                      <Badge variant="default" className="text-xs px-1.5 py-0.5">
                        Contributor
                      </Badge>
                    )}
                  </div>
                  {user.name && (
                    <p className="text-sm text-gray-500 truncate">
                      {user.name}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}


