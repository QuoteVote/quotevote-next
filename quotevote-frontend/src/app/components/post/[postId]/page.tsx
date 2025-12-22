// app/post/[postId]/page.tsx
import { Metadata } from 'next'
import { PostPageClient } from '@/components/Post/PostPageClient'

/**
 * Page props for dynamic post route
 */
interface PostPageProps {
  params: {
    postId: string
  }
  searchParams?: {
    [key: string]: string | string[] | undefined
  }
}

/**
 * Generate metadata for the post page
 * This runs on the server and generates page metadata (title, description, etc.)
 */
export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { postId } = params

  // In a real app, you could fetch the post here to get the actual title
  // For now, we'll use a generic title
  return {
    title: `Post ${postId} | QuoteVote`,
    description: 'View and interact with this post on QuoteVote',
    openGraph: {
      title: `Post ${postId} | QuoteVote`,
      description: 'View and interact with this post on QuoteVote',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Post ${postId} | QuoteVote`,
      description: 'View and interact with this post on QuoteVote',
    },
  }
}

/**
 * Post detail page - Server Component
 * 
 * This is the main page component for viewing individual posts.
 * It handles the dynamic routing and passes the postId to the client component.
 * 
 * Route: /post/[postId]
 * Example: /post/507f1f77bcf86cd799439011
 * 
 * @param props - Page props with postId parameter
 */
export default function PostPage({ params }: PostPageProps): JSX.Element {
  const { postId } = params

  return (
    <main className="min-h-screen bg-background">
      <PostPageClient postId={postId} />
    </main>
  )
}
