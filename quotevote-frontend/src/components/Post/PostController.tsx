'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAppStore } from '@/store'
import type { PostControllerProps } from '@/types/post'

/**
 * PostController Component
 * 
 * Controller component for individual post pages.
 * Handles post selection and page state management.
 * 
 * Note: This component is a placeholder. The actual PostPage component
 * should be created in the app directory following Next.js App Router patterns.
 */
export default function PostController({ postId: propPostId }: PostControllerProps) {
  const params = useParams()
  const postId = propPostId || (params?.postId as string) || ''
  const setSelectedPage = useAppStore((state) => state.setSelectedPage)

  useEffect(() => {
    setSelectedPage('')
  }, [setSelectedPage])

  // TODO: Implement PostPage component in app directory
  // This should render the actual post page with Post component
  // For now, this is a placeholder that can be used as a reference
  
  return (
    <div className="container mx-auto p-4">
      <p className="text-muted-foreground">
        PostController: Post ID {postId}
        <br />
        <small>PostPage component should be implemented in app directory</small>
      </p>
    </div>
  )
}

