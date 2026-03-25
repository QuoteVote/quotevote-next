'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@apollo/client/react'
import { useAppStore } from '@/store'
import { GET_POST } from '@/graphql/queries'
import Post from './Post'
import PostSkeleton from './PostSkeleton'
import type { PostControllerProps, PostQueryData } from '@/types/post'

/**
 * PostController Component
 *
 * Controller component for individual post pages.
 * Fetches post data by ID and renders the Post component.
 */
export default function PostController({ postId }: PostControllerProps) {
  const router = useRouter()
  const userData = useAppStore((state) => state.user.data)
  const setSelectedPage = useAppStore((state) => state.setSelectedPage)

  const { loading, error, data, refetch } = useQuery<PostQueryData>(GET_POST, {
    variables: { postId },
    fetchPolicy: 'network-only',
    skip: !postId,
  })

  useEffect(() => {
    setSelectedPage('')
  }, [setSelectedPage])

  if (!postId) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    )
  }

  if (loading) return <PostSkeleton />

  if (error) {
    router.push('/error')
    return null
  }

  if (!data?.post) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    )
  }

  const post = data.post

  // Normalize user data to match PostProps.user shape
  const user = {
    _id: (userData._id as string | undefined) || userData.id,
    admin: userData.admin,
    _followingId: Array.isArray(userData._followingId)
      ? (userData._followingId as string[])
      : userData._followingId
        ? [userData._followingId as string]
        : [],
  }

  const postActions = [
    ...(post.comments || []).map((c) => ({ ...c, __typename: 'Comment' })),
    ...(post.votes || []).map((v) => ({ ...v, __typename: 'Vote' })),
    ...(post.quotes || []).map((q) => ({ ...q, __typename: 'Quote' })),
  ]

  return (
    <Post
      post={post}
      user={user}
      postActions={postActions}
      refetchPost={refetch}
    />
  )
}
