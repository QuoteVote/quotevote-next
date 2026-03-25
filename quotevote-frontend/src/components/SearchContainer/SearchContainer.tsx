'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search as SearchIcon, SearchX } from 'lucide-react'
import { useQuery } from '@apollo/client/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/useDebounce'
import PostCard from '@/components/Post/PostCard'
import PostSkeleton from '@/components/Post/PostSkeleton'
import {
  GET_TOP_POSTS,
  GET_FEATURED_POSTS,
  GET_FRIENDS_POSTS,
  SEARCH_USERNAMES,
} from '@/graphql/queries'
import { useAppStore } from '@/store'
import UsernameResults from './UsernameResults'
import SearchGuestSections from './SearchGuestSections'
import { MOCK_POSTS } from '@/lib/mock-data'
import type { Post, PostsListData } from '@/types/post'
import type { UsernameSearchUser } from '@/types/components'

interface FeaturedPostsData {
  featuredPosts: {
    entities: Post[]
    pagination: {
      total_count: number
      limit: number
      offset: number
    }
  }
}

const LIMIT = 20

/**
 * PostsTab — renders a list of posts from a query result
 */
function PostsTab({
  posts,
  loading,
  searchKey,
}: {
  posts: Post[]
  loading: boolean
  searchKey?: string
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    )
  }

  if (!posts.length) {
    // When browsing (no search), show mock posts so the feed always has content
    if (!searchKey) {
      return (
        <div className="space-y-4">
          {MOCK_POSTS.map((post) => (
            <PostCard
              key={post._id}
              _id={post._id}
              text={post.text}
              title={post.title}
              url={post.url}
              citationUrl={post.citationUrl}
              bookmarkedBy={post.bookmarkedBy ?? []}
              approvedBy={post.approvedBy ?? []}
              rejectedBy={post.rejectedBy ?? []}
              created={post.created}
              creator={post.creator ?? undefined}
              votes={post.votes ?? []}
              comments={post.comments ?? []}
              quotes={post.quotes ?? []}
              messageRoom={post.messageRoom ?? undefined}
              groupId={post.groupId}
            />
          ))}
        </div>
      )
    }
    // Search with no results
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchX className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-base font-semibold text-foreground">No posts found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try a different search term
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post._id}
          _id={post._id}
          text={post.text}
          title={post.title}
          url={post.url}
          citationUrl={post.citationUrl}
          bookmarkedBy={post.bookmarkedBy ?? []}
          approvedBy={post.approvedBy ?? []}
          rejectedBy={post.rejectedBy ?? []}
          created={post.created}
          creator={post.creator ?? undefined}
          votes={post.votes ?? []}
          comments={post.comments ?? []}
          quotes={post.quotes ?? []}
          messageRoom={post.messageRoom ?? undefined}
          groupId={post.groupId}
          searchKey={searchKey}
        />
      ))}
    </div>
  )
}

/**
 * TrendingTab — loads top posts
 */
function TrendingTab({ from, to }: { from: string; to: string }) {
  const { loading, data } = useQuery<PostsListData>(GET_TOP_POSTS, {
    variables: {
      limit: LIMIT,
      offset: 0,
      searchKey: '',
      startDateRange: from || undefined,
      endDateRange: to || undefined,
    },
  })
  const posts: Post[] = data?.posts?.entities ?? []
  return <PostsTab posts={posts} loading={loading} />
}

/**
 * FeaturedTab — loads featured posts
 */
function FeaturedTab({ from, to }: { from: string; to: string }) {
  const { loading, data } = useQuery<FeaturedPostsData>(GET_FEATURED_POSTS, {
    variables: {
      limit: LIMIT,
      offset: 0,
      searchKey: '',
      startDateRange: from || undefined,
      endDateRange: to || undefined,
    },
  })
  const posts: Post[] = data?.featuredPosts?.entities ?? []
  return <PostsTab posts={posts} loading={loading} />
}

/**
 * FriendsTab — loads posts from friends
 */
function FriendsTab({ from, to }: { from: string; to: string }) {
  const { loading, data } = useQuery<PostsListData>(GET_FRIENDS_POSTS, {
    variables: {
      limit: LIMIT,
      offset: 0,
      searchKey: '',
      startDateRange: from || undefined,
      endDateRange: to || undefined,
      friendsOnly: true,
    },
  })
  const posts: Post[] = data?.posts?.entities ?? []
  return <PostsTab posts={posts} loading={loading} />
}

/**
 * SearchTab — loads posts matching a search query
 */
function SearchTab({
  searchKey,
  from,
  to,
}: {
  searchKey: string
  from: string
  to: string
}) {
  const { loading, data } = useQuery<PostsListData>(GET_TOP_POSTS, {
    variables: {
      limit: LIMIT,
      offset: 0,
      searchKey,
      startDateRange: from || undefined,
      endDateRange: to || undefined,
    },
    skip: !searchKey,
  })
  const posts: Post[] = data?.posts?.entities ?? []
  return <PostsTab posts={posts} loading={loading && !!searchKey} searchKey={searchKey} />
}

/**
 * SearchContainer Component
 *
 * Full-featured search container with URL-synced tabs and debounced search input.
 * Tabs: Trending | Featured | Friends | Search (only when ?q= is set)
 */
export default function SearchContainer() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAppStore((state) => state.user.data)

  const q = searchParams.get('q') || ''
  const tab = searchParams.get('tab') || 'trending'
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''

  const [inputValue, setInputValue] = useState(q)
  const debouncedQuery = useDebounce(inputValue, 400)

  // Sync debounced query to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (debouncedQuery) {
      params.set('q', debouncedQuery)
      if (params.get('tab') !== 'search') {
        params.set('tab', 'search')
      }
    } else {
      params.delete('q')
      if (params.get('tab') === 'search') {
        params.set('tab', 'trending')
      }
    }
    router.replace(`?${params.toString()}`)
    // Only run when debouncedQuery changes; avoid re-running on searchParams changes to prevent loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
    },
    []
  )

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', value)
      router.replace(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  // User search for username results dropdown
  const { loading: usersLoading, data: usersData, error: usersError } = useQuery<{
    searchUser: UsernameSearchUser[]
  }>(SEARCH_USERNAMES, {
    variables: { query: debouncedQuery },
    skip: !debouncedQuery,
  })

  // Determine active tab — if no query, don't show 'search' tab as active
  const activeTab = q ? tab : tab === 'search' ? 'trending' : tab
  const isLoggedIn = !!(user?._id || user?.id)

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search posts, people, and more..."
          value={inputValue}
          onChange={handleInputChange}
          className="pl-12 h-12 text-base rounded-xl bg-muted/50 border-0 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-0"
          aria-label="Search posts"
        />
        {debouncedQuery && (
          <UsernameResults
            users={usersData?.searchUser ?? []}
            loading={usersLoading}
            error={usersError ?? null}
            query={debouncedQuery}
          />
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList
          variant="line"
          className="w-full justify-start border-b border-border rounded-none bg-transparent p-0"
        >
          <TabsTrigger
            value="trending"
            className="flex-1 rounded-none bg-transparent font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Trending
          </TabsTrigger>
          <TabsTrigger
            value="featured"
            className="flex-1 rounded-none bg-transparent font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Featured
          </TabsTrigger>
          {isLoggedIn && (
            <TabsTrigger
              value="friends"
              className="flex-1 rounded-none bg-transparent font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Friends
            </TabsTrigger>
          )}
          {q && (
            <TabsTrigger
              value="search"
              className="flex-1 rounded-none bg-transparent font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Search
            </TabsTrigger>
          )}
        </TabsList>

        <div className="mt-4">
          <TabsContent value="trending">
            <TrendingTab from={from} to={to} />
          </TabsContent>

          <TabsContent value="featured">
            <FeaturedTab from={from} to={to} />
          </TabsContent>

          {isLoggedIn && (
            <TabsContent value="friends">
              <FriendsTab from={from} to={to} />
            </TabsContent>
          )}

          {q && (
            <TabsContent value="search">
              <SearchTab searchKey={q} from={from} to={to} />
            </TabsContent>
          )}
        </div>
      </Tabs>

      <SearchGuestSections />
    </div>
  )
}
