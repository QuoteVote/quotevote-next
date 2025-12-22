// src/components/Post/PostPageClient.tsx
'use client'

import { JSX, useEffect } from 'react'
import { useAppStore } from '@/store'
import { PostView } from './PostView'

interface PostPageClientProps {
  postId: string
}

export function PostPageClient({ postId }: PostPageClientProps): JSX.Element {
  // Example: If you need to update store state
  const setSelectedPage = useAppStore((state) => state.setSelectedPage)
  
  useEffect(() => {
    // Update store if needed
    setSelectedPage?.(null)
  }, [setSelectedPage])

  return <PostView postId={postId} />
}
