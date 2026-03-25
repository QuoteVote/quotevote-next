'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search as SearchIcon,
  TrendingUp,
  Star,
  Users,
  PenSquare,
  X,
} from 'lucide-react'
import { useQuery } from '@apollo/client/react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useDebounce } from '@/hooks/useDebounce'
import PaginatedPostsList from '@/components/Post/PaginatedPostsList'
import {
  GET_FEATURED_POSTS,
  SEARCH_USERNAMES,
} from '@/graphql/queries'
import { useAppStore } from '@/store'
import UsernameResults from '@/components/SearchContainer/UsernameResults'
import SearchGuestSections from '@/components/SearchContainer/SearchGuestSections'
import type { UsernameSearchUser } from '@/types/components'

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
  const [selectedUser, setSelectedUser] = useState<UsernameSearchUser | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(inputValue, 400)

  // Detect @username mode
  const isUsernameSearch = inputValue.startsWith('@')
  const usernameQuery = isUsernameSearch ? inputValue.slice(1) : ''

  // Sync debounced query to URL
  useEffect(() => {
    // Don't sync username searches or when filtering by user
    if (isUsernameSearch || selectedUser) return

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
  }, [debouncedQuery, isUsernameSearch, selectedUser])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
      // Clear selected user when typing
      if (selectedUser) setSelectedUser(null)
    },
    [selectedUser]
  )

  const clearSearch = useCallback(() => {
    setInputValue('')
    setSelectedUser(null)
  }, [])

  const handleUserSelect = useCallback((user: UsernameSearchUser) => {
    setSelectedUser(user)
    setInputValue('')
    setSearchFocused(false)
  }, [])

  const clearSelectedUser = useCallback(() => {
    setSelectedUser(null)
  }, [])

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', value)
      router.replace(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  // Username search dropdown — triggered by @prefix or general search
  const searchQueryForUsers = isUsernameSearch ? usernameQuery : debouncedQuery
  const {
    loading: usersLoading,
    data: usersData,
    error: usersError,
  } = useQuery<{ searchUser: UsernameSearchUser[] }>(SEARCH_USERNAMES, {
    variables: { query: searchQueryForUsers },
    skip: !searchQueryForUsers,
  })

  const hasSearch = q || selectedUser
  const activeTab = hasSearch ? 'search' : tab === 'search' ? 'trending' : tab
  const isLoggedIn = !!(user?._id || user?.id)

  const tabs = [
    { value: 'trending', label: 'Trending', icon: TrendingUp },
    { value: 'featured', label: 'Featured', icon: Star },
    ...(isLoggedIn
      ? [{ value: 'friends', label: 'Friends', icon: Users }]
      : []),
    ...(hasSearch
      ? [{ value: 'search', label: 'Results', icon: SearchIcon }]
      : []),
  ]

  return (
    <div className="-mx-4 -mt-6 md:-mx-4">
      {/* ── Sticky search bar ── */}
      <div className="sticky top-14 md:top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-2.5">
          {/* Selected user filter chip */}
          {selectedUser && (
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="flex items-center gap-1.5 pl-2 pr-1 py-1">
                <span className="text-xs">Posts by @{selectedUser.username}</span>
                <button
                  type="button"
                  onClick={clearSelectedUser}
                  className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                  aria-label="Clear user filter"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            </div>
          )}
          <div className="relative" ref={searchRef}>
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder={selectedUser ? `Filter posts by @${selectedUser.username}...` : 'Search posts, @username, topics...'}
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className="pl-10 pr-10 h-10 text-sm rounded-full bg-muted/60 border-0 focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:shadow-sm transition-all"
              aria-label="Search posts"
            />
            {(inputValue || selectedUser) && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}

            {/* Username dropdown — shown on @prefix or general search */}
            {searchQueryForUsers && searchFocused && (
              <UsernameResults
                users={usersData?.searchUser ?? []}
                loading={usersLoading}
                error={usersError ?? null}
                query={searchQueryForUsers}
                onUserSelect={handleUserSelect}
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
            <PaginatedPostsList
              defaultPageSize={15}
              maxVisiblePages={5}
              startDateRange={from || undefined}
              endDateRange={to || undefined}
            />
          </TabsContent>

          <TabsContent value="featured" className="mt-0">
            <PaginatedPostsList
              query={GET_FEATURED_POSTS}
              dataKey="featuredPosts"
              defaultPageSize={15}
              maxVisiblePages={5}
              startDateRange={from || undefined}
              endDateRange={to || undefined}
            />
          </TabsContent>

          {isLoggedIn && (
            <TabsContent value="friends" className="mt-0">
              <PaginatedPostsList
                defaultPageSize={15}
                maxVisiblePages={5}
                friendsOnly
                startDateRange={from || undefined}
                endDateRange={to || undefined}
              />
            </TabsContent>
          )}

          {hasSearch && (
            <TabsContent value="search" className="mt-0">
              <PaginatedPostsList
                defaultPageSize={15}
                maxVisiblePages={5}
                searchKey={q}
                userId={selectedUser?._id}
                startDateRange={from || undefined}
                endDateRange={to || undefined}
              />
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
