'use client'

import { useQuery } from '@apollo/client/react'
import { useAppStore } from '@/store'
import { GROUPS_QUERY } from '@/graphql/queries'
import { SubmitPostSkeleton } from './SubmitPostSkeleton'
import { SubmitPostForm } from './SubmitPostForm'
import type { SubmitPostProps, Group } from '@/types/components'

export function SubmitPost({ setOpen }: SubmitPostProps) {
  const user = useAppStore((state) => state.user.data)
  const { loading, error, data } = useQuery(GROUPS_QUERY, {
    variables: { limit: 0 },
  })

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Something went wrong! Please try again.
      </div>
    )
  }

  if (loading) {
    return <SubmitPostSkeleton />
  }

  const userId = user?._id || user?.id
  if (!user || !userId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Please log in to create a post.
      </div>
    )
  }

  const groupsOptions: Group[] =
    ((data as { groups?: Group[] })?.groups?.filter((group: Group) => {
      const isUserAllowed = group.allowedUserIds?.find(
        (id) => id === userId
      )
      return (
        group.privacy === 'public' ||
        (group.privacy === 'private' && isUserAllowed)
      )
    }) || []) as Group[]

  return (
    <SubmitPostForm
      options={groupsOptions}
      user={{ _id: String(userId), ...user } as { _id: string; [key: string]: unknown }}
      setOpen={setOpen}
    />
  )
}

