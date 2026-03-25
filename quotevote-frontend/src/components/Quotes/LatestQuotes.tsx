'use client'

import { useQuery } from '@apollo/client/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GET_TOP_POSTS } from '@/graphql/queries'
import type { LatestQuotesProps } from '@/types/components'

interface QuoteData {
  _id: string
  quote?: string
  startWordIndex?: number
  endWordIndex?: number
  user?: {
    _id: string
    username: string
  }
}

interface PostEntity {
  _id: string
  title: string
  quotes?: QuoteData[]
}

interface TopPostsResponse {
  posts: {
    entities: PostEntity[]
  }
}

/**
 * LatestQuotes sidebar widget.
 * Fetches recent posts and extracts their quotes to display.
 */
export function LatestQuotes({ limit = 5 }: LatestQuotesProps) {
  const { data } = useQuery<TopPostsResponse>(GET_TOP_POSTS, {
    variables: {
      limit: 10,
      offset: 0,
      searchKey: '',
    },
    fetchPolicy: 'cache-first',
  })

  // Extract quotes from the fetched posts
  const quotes: (QuoteData & { postTitle: string })[] = []
  if (data?.posts?.entities) {
    for (const post of data.posts.entities) {
      if (post.quotes) {
        for (const q of post.quotes) {
          if (q.quote || q._id) {
            quotes.push({ ...q, postTitle: post.title })
          }
        }
      }
      if (quotes.length >= limit) break
    }
  }

  const displayQuotes = quotes.slice(0, limit)

  if (!displayQuotes.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Latest Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No quotes yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Latest Quotes</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {displayQuotes.map((q) => (
            <li key={q._id} className="block">
              <p className="text-sm italic text-muted-foreground border-l-2 border-primary/40 pl-2">
                {q.quote || 'Quoted text'}
              </p>
              {q.user?.username && (
                <p className="text-xs text-muted-foreground mt-1">
                  — {q.user.username}
                </p>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
