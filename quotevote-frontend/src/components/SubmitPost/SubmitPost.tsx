'use client'

import { useAppStore } from '@/store'
import { MOCK_GROUPS } from '@/lib/mock-data'
import { SubmitPostForm } from './SubmitPostForm'
import type { SubmitPostProps } from '@/types/components'

export function SubmitPost({ setOpen }: SubmitPostProps) {
  const user = useAppStore((state) => state.user.data)

  const userId = user?._id || user?.id
  if (!user || !userId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Please log in to create a post.
      </div>
    )
  }

  return (
    <SubmitPostForm
      options={MOCK_GROUPS}
      user={{ _id: String(userId), ...user } as { _id: string; [key: string]: unknown }}
      setOpen={setOpen}
    />
  )
}

