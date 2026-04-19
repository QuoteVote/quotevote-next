'use client'

import { useQuery } from '@apollo/client/react'
import { useAppStore } from '@/store'
import { GROUPS_QUERY } from '@/graphql/queries'
import { SubmitPostForm } from './SubmitPostForm'
import { SubmitPostSkeleton } from './SubmitPostSkeleton'
import type { SubmitPostProps, Group } from '@/types/components'

export function SubmitPost({ setOpen }: SubmitPostProps) {
  const user = useAppStore((state) => state.user.data)
  const userId = user?._id || user?.id

  const { loading, error, data } = useQuery(GROUPS_QUERY, {
    variables: { limit: 0 },
    skip: !userId,
  })

  if (!user || !userId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Please log in to create a post.
      </div>
    )
  }

  if (error) {
    return <div className="p-4 text-center text-destructive">Something went wrong!</div>
  }

  if (loading) {
    return <SubmitPostSkeleton />
  }

  const groups: Group[] = (data as { groups?: Group[] } | undefined)?.groups ?? []
  const groupsOptions: Group[] = groups.filter((group) => {
    const isUserAllowed = group.allowedUserIds?.includes(String(userId)) ?? false
    return group.privacy === 'public' || (group.privacy === 'private' && isUserAllowed)
  })

  return (
    <SubmitPostForm
      options={groupsOptions}
      user={{ _id: String(userId), ...user } as { _id: string; [key: string]: unknown }}
      setOpen={setOpen}
    />
  )
}

