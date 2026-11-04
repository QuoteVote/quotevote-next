'use client'

import { useQuery } from '@apollo/client/react'
import { useAppStore } from '@/store'
import { TAGS_QUERY } from '@/graphql/queries'
import { SubmitPostForm } from './SubmitPostForm'
import { SubmitPostSkeleton } from './SubmitPostSkeleton'
import type { SubmitPostProps, Tag } from '@/types/components'

export function SubmitPost({ setOpen }: SubmitPostProps) {
  const user = useAppStore((state) => state.user.data)
  const userId = user?._id || user?.id

  // No limit: the composer lists every tag the member can post to.
  const { loading, error, data } = useQuery(TAGS_QUERY, { skip: !userId })

  if (!user || !userId) {
    return (
      <div className="flex h-full min-h-[12rem] items-center justify-center p-4 text-center text-muted-foreground">
        Please log in to create a post.
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[12rem] items-center justify-center p-4 text-center text-destructive">
        Something went wrong!
      </div>
    )
  }

  if (loading) {
    return <SubmitPostSkeleton />
  }

  const tags: Tag[] = (data as { tags?: Tag[] } | undefined)?.tags ?? []
  const tagOptions: Tag[] = tags.filter((tag) => {
    const isUserAllowed = tag.allowedUserIds?.includes(String(userId)) ?? false
    return tag.privacy === 'public' || (tag.privacy === 'private' && isUserAllowed)
  })

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <SubmitPostForm
        options={tagOptions}
        user={{ _id: String(userId), ...user } as { _id: string; [key: string]: unknown }}
        setOpen={setOpen}
      />
    </div>
  )
}

