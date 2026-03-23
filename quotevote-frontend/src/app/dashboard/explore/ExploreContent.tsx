'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search as SearchIcon,
  SearchX,
  TrendingUp,
  Star,
  Users,
  PenSquare,
  X,
} from 'lucide-react'
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
import UsernameResults from '@/components/SearchContainer/UsernameResults'
import SearchGuestSections from '@/components/SearchContainer/SearchGuestSections'
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

/* ------------------------------------------------------------------ */
/*  PostsTab                                                           */
/* ------------------------------------------------------------------ */
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
      <div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-b border-border">
            <PostSkeleton />
          </div>
        ))}
      </div>
    )
  }

  if (!posts.length) {
    if (!searchKey) {
      return (
        <div>
          {MOCK_POSTS.map((post) => (
            <div key={post._id} className="border-b border-border">
              <PostCard
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
            </div>
          ))}
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="size-16 rounded-full bg-muted/60 flex items-center justify-center mb-4">
          <SearchX className="size-8 text-muted-foreground/60" />
        </div>
        <p className="text-lg font-semibold text-foreground">No results found</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Try searching with different keywords or check your spelling
        </p>
      </div>
    )
  }

  return (
    <div>
      {posts.map((post) => (
        <div key={post._id} className="border-b border-border">
          <PostCard
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
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tab data components                                                */
/* ------------------------------------------------------------------ */
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
  return <PostsTab posts={data?.posts?.entities ?? []} loading={loading} />
}

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
  return <PostsTab posts={data?.featuredPosts?.entities ?? []} loading={loading} />
}

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
  return <PostsTab posts={data?.posts?.entities ?? []} loading={loading} />
}

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
  return (
    <PostsTab
      posts={data?.posts?.entities ?? []}
      loading={loading && !!searchKey}
      searchKey={searchKey}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  ExploreContent — main component                                    */
/* ------------------------------------------------------------------ */
export default function ExploreContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAppStore((state) => state.user.data)

  const q = searchParams.get('q') || ''
  const tab = searchParams.get('tab') || 'trending'
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''

  const [inputValue, setInputValue] = useState(q)
  const [searchFocused, setSearchFocused] = useState(false)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
    },
    []
  )

  const clearSearch = useCallback(() => {
    setInputValue('')
  }, [])

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', value)
      router.replace(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  // Username search dropdown
  const {
    loading: usersLoading,
    data: usersData,
    error: usersError,
  } = useQuery<{ searchUser: UsernameSearchUser[] }>(SEARCH_USERNAMES, {
    variables: { query: debouncedQuery },
    skip: !debouncedQuery,
  })

  const activeTab = q ? tab : tab === 'search' ? 'trending' : tab
  const isLoggedIn = !!(user?._id || user?.id)

  const tabs = [
    { value: 'trending', label: 'Trending', icon: TrendingUp },
    { value: 'featured', label: 'Featured', icon: Star },
    ...(isLoggedIn
      ? [{ value: 'friends', label: 'Friends', icon: Users }]
      : []),
    ...(q
      ? [{ value: 'search', label: 'Results', icon: SearchIcon }]
      : []),
  ]

  return (
    <div className="-mx-4 -mt-6 md:-mx-4">
      {/* ── Sticky search bar ── */}
      <div className="sticky top-14 md:top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-2.5">
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search posts, people, topics..."
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className="pl-10 pr-10 h-10 text-sm rounded-full bg-muted/60 border-0 focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:shadow-sm transition-all"
              aria-label="Search posts"
            />
            {inputValue && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}

            {/* Username dropdown */}
            {debouncedQuery && searchFocused && (
              <UsernameResults
                users={usersData?.searchUser ?? []}
                loading={usersLoading}
                error={usersError ?? null}
                query={debouncedQuery}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Quick actions (compact pill row) ── */}
      <div className="border-b border-border bg-background">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <Link
              href="/dashboard/post"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap shadow-sm"
            >
              <PenSquare className="size-3.5" />
              Write
            </Link>
            <Link
              href="/dashboard/explore?tab=trending"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted/70 text-foreground/80 text-xs font-medium hover:bg-muted transition-colors whitespace-nowrap"
            >
              <TrendingUp className="size-3.5" />
              Trending
            </Link>
            <Link
              href="/dashboard/explore?tab=featured"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted/70 text-foreground/80 text-xs font-medium hover:bg-muted transition-colors whitespace-nowrap"
            >
              <Star className="size-3.5" />
              Featured
            </Link>
            {isLoggedIn && (
              <Link
                href="/dashboard/explore?tab=friends"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted/70 text-foreground/80 text-xs font-medium hover:bg-muted transition-colors whitespace-nowrap"
              >
                <Users className="size-3.5" />
                Friends
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs + feed ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="sticky top-[105px] md:top-[113px] z-20 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="max-w-2xl mx-auto">
            <TabsList
              variant="line"
              className="w-full justify-start bg-transparent p-0 rounded-none h-auto"
            >
              {tabs.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex-1 gap-1.5 py-3 rounded-none bg-transparent text-sm font-medium text-muted-foreground
                    data-[state=active]:text-foreground data-[state=active]:shadow-none
                    data-[state=active]:border-b-2 data-[state=active]:border-primary
                    hover:text-foreground hover:bg-muted/30 transition-colors"
                >
                  <Icon className="size-4 hidden sm:inline-block" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <TabsContent value="trending" className="mt-0">
            <TrendingTab from={from} to={to} />
          </TabsContent>

          <TabsContent value="featured" className="mt-0">
            <FeaturedTab from={from} to={to} />
          </TabsContent>

          {isLoggedIn && (
            <TabsContent value="friends" className="mt-0">
              <FriendsTab from={from} to={to} />
            </TabsContent>
          )}

          {q && (
            <TabsContent value="search" className="mt-0">
              <SearchTab searchKey={q} from={from} to={to} />
            </TabsContent>
          )}
        </div>
      </Tabs>

      {/* Guest CTA */}
      <div className="max-w-2xl mx-auto px-4">
        <SearchGuestSections />
      </div>
    </div>
  )
}
