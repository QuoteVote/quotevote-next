'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Search as SearchIcon, X, Loader2 } from 'lucide-react'
import { useQuery } from '@apollo/client/react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import PaginatedPostsList from '@/components/Post/PaginatedPostsList'
import { SEARCH_USERNAMES } from '@/graphql/queries'
import { useAppStore } from '@/store'
import UsernameResults from '@/components/SearchContainer/UsernameResults'
import SearchGuestSections from '@/components/SearchContainer/SearchGuestSections'
import DateRangeFilter from '@/components/SearchContainer/DateRangeFilter'
import AvatarDisplay from '@/components/Avatar'
import { SubmitPost } from '@/components/SubmitPost/SubmitPost'
import type { UsernameSearchUser } from '@/types/components'

type SortOrder = 'desc' | 'asc' | ''

export default function ExploreContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAppStore((state) => state.user.data)
  const isLoggedIn = !!(user?._id || user?.id)

  // URL-driven state
  const q = searchParams.get('q') || ''
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const sortParam = (searchParams.get('sort') || '') as SortOrder

  // Local UI state
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [inputValue, setInputValue] = useState(q)
  const [searchFocused, setSearchFocused] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UsernameSearchUser | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>(sortParam)
  const [interactions, setInteractions] = useState(false)
  const [friends, setFriends] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)

  // Debounce the text input for live search (400 ms matches monorepo feel)
  const debouncedQuery = useDebounce(inputValue, 400)

  // True while the user is still typing and the debounce hasn't fired yet
  const isDebouncePending = useMemo(
    () => inputValue !== debouncedQuery && inputValue.length > 0,
    [inputValue, debouncedQuery]
  )

  // @username detection — drives real-time username dropdown only
  const isUsernameSearch = inputValue.startsWith('@')
  const usernameQuery = isUsernameSearch ? inputValue.slice(1) : ''

  // URL update helper
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, val]) => {
        if (val) params.set(key, val)
        else params.delete(key)
      })
      router.replace(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  // Sync debounced query to URL — live search fires here automatically
  useEffect(() => {
    if (isUsernameSearch || selectedUser) return
    const params = new URLSearchParams(searchParams.toString())
    if (debouncedQuery) {
      params.set('q', debouncedQuery)
    } else {
      params.delete('q')
    }
    router.replace(`?${params.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, isUsernameSearch, selectedUser])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
      if (selectedUser) setSelectedUser(null)
    },
    [selectedUser]
  )

  const clearSearch = useCallback(() => {
    setInputValue('')
    setSelectedUser(null)
    updateParams({ q: null })
  }, [updateParams])

  // Called when user picks a result from the @username dropdown
  const handleUserSelect = useCallback(
    (u: UsernameSearchUser) => {
      setSelectedUser(u)
      setInputValue('')
      setSearchFocused(false)
      // Clear the text search query — backend gets searchKey='' with userId set
      updateParams({ q: null })
    },
    [updateParams]
  )

  const clearSelectedUser = useCallback(() => setSelectedUser(null), [])

  const handleDateChange = useCallback(
    (newFrom: string, newTo: string) => {
      updateParams({ from: newFrom || null, to: newTo || null })
    },
    [updateParams]
  )

  const handleSortCycle = useCallback(() => {
    const next: SortOrder = sortOrder === '' ? 'desc' : sortOrder === 'desc' ? 'asc' : ''
    setSortOrder(next)
    updateParams({ sort: next || null })
  }, [sortOrder, updateParams])

  // Username search — real-time, fires on every keystroke when @ is detected
  const {
    loading: usersLoading,
    data: usersData,
    error: usersError,
  } = useQuery<{ searchUser: UsernameSearchUser[] }>(SEARCH_USERNAMES, {
    variables: { query: usernameQuery },
    skip: !usernameQuery,
  })

  const hasDateFilter = !!(from || to)
  const hasAnyFilter =
    interactions || friends || sortOrder !== '' || hasDateFilter || !!q || !!selectedUser

  const filterIconBtn = (active: boolean) =>
    cn(
      'flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border transition-all shadow-sm min-w-[60px] hover:scale-[1.02] cursor-pointer',
      active
        ? 'border-primary bg-primary/10'
        : 'border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/40'
    )

  return (
    <div className="-mx-4 -mt-6 md:-mx-4">
      {/* ── Logo + tagline ── */}
      <div className="flex flex-col items-center py-8 px-4 border-b border-border">
        <Image
          src="/assets/QuoteVoteLogo.png"
          alt="QuoteVote"
          width={220}
          height={66}
          className="mb-3"
          priority
        />
        <p className="text-sm text-muted-foreground text-center">
          No algorithms. No ads. Just conversations.
        </p>
      </div>

      {/* ── Sticky search + filters ── */}
      <div className="sticky top-14 md:top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">

          {/* Search input — live search via debounce, @username via real-time dropdown */}
          <div className="relative" ref={searchRef}>
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground pointer-events-none" />

            <Input
              type="text"
              placeholder={
                selectedUser
                  ? `Showing posts by @${selectedUser.username}`
                  : 'Search...'
              }
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className={cn(
                'pl-10 pr-10 h-10 text-sm rounded-full bg-muted/60 border-0 focus-visible:bg-card focus-visible:ring-1 focus-visible:shadow-sm transition-all',
                isUsernameSearch
                  ? 'ring-1 ring-primary focus-visible:ring-primary'
                  : 'focus-visible:ring-primary/30'
              )}
              aria-label="Search posts"
            />

            {/* Right-side indicator: spinner while debounce pending, X to clear */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isDebouncePending && !isUsernameSearch ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Processing search" />
              ) : (inputValue || selectedUser) ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>

            {/* Min-chars hint */}
            {inputValue.length > 0 && inputValue.length < 2 && !isUsernameSearch && searchFocused && (
              <div className="absolute top-full left-0 right-0 mt-1 z-[1000]">
                <div className="bg-card border border-border rounded-lg shadow-md px-3 py-2">
                  <p className="text-xs text-muted-foreground">Type 2+ characters to search</p>
                </div>
              </div>
            )}

            {/* @username dropdown — real-time results while typing */}
            {usernameQuery && searchFocused && (
              <UsernameResults
                users={(usersData?.searchUser ?? []) as UsernameSearchUser[]}
                loading={usersLoading}
                error={usersError ?? null}
                query={usernameQuery}
                onUserSelect={handleUserSelect}
              />
            )}
          </div>

          {/* ── Filter icon buttons ── */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <button
              type="button"
              onClick={() => setSubmitDialogOpen(true)}
              title="Create a quote"
              className={filterIconBtn(false)}
            >
              <span className="text-lg leading-none">✍️</span>
              <span className="text-[10px] text-muted-foreground font-medium">Write</span>
            </button>

            {isLoggedIn && (
              <button
                type="button"
                onClick={() => setFriends((f) => !f)}
                title={friends ? 'Showing friends posts' : 'Show posts from people you follow'}
                className={filterIconBtn(friends)}
              >
                <span className="text-lg leading-none">👥</span>
                <span className="text-[10px] font-medium">Friends</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setInteractions((i) => !i)}
              title="Sort by most interactions"
              className={filterIconBtn(interactions)}
            >
              <span className="text-lg leading-none">🧲</span>
              <span className="text-[10px] font-medium">Popular</span>
            </button>

            <button
              type="button"
              onClick={handleSortCycle}
              title={
                sortOrder === ''
                  ? 'Default order'
                  : sortOrder === 'desc'
                    ? 'Newest first'
                    : 'Oldest first'
              }
              className={filterIconBtn(sortOrder !== '')}
            >
              <span className="text-lg leading-none">{sortOrder === 'asc' ? '⏳' : '⌛'}</span>
              <span className="text-[10px] font-medium">
                {sortOrder === 'asc' ? 'Oldest' : sortOrder === 'desc' ? 'Newest' : 'Sort'}
              </span>
            </button>

            <DateRangeFilter startDate={from} endDate={to} onDateChange={handleDateChange} />
          </div>

          {/* Active filter summary pills */}
          {hasAnyFilter && (
            <div className="mt-3 flex flex-wrap gap-1.5 justify-center text-xs">
              {q && !selectedUser && (
                <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                  🔍 &quot;{q}&quot;
                </span>
              )}
              {friends && (
                <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                  👥 Friends Only
                </span>
              )}
              {interactions && (
                <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                  🧲 By Interactions
                </span>
              )}
              {sortOrder === 'desc' && (
                <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                  ⌛ Newest First
                </span>
              )}
              {sortOrder === 'asc' && (
                <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                  ⏳ Oldest First
                </span>
              )}
              {hasDateFilter && (
                <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                  📅 {from || '…'} — {to || '…'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Selected user card ── */}
      {selectedUser && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg shadow-sm">
            <AvatarDisplay
              src={selectedUser.avatar}
              alt={selectedUser.name || selectedUser.username}
              size={48}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{selectedUser.name}</p>
              <p className="text-xs text-muted-foreground truncate">@{selectedUser.username}</p>
            </div>
            <button
              type="button"
              onClick={clearSelectedUser}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
              aria-label="Clear user filter"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Result count ── */}
      {totalCount > 0 && hasAnyFilter && (
        <div className="max-w-2xl mx-auto px-4 pt-3">
          <p className="text-sm font-medium text-muted-foreground text-center">
            {totalCount.toLocaleString()} {totalCount === 1 ? 'result' : 'results'} found
          </p>
        </div>
      )}

      {/* ── Posts feed ── */}
      <div className="max-w-2xl mx-auto">
        <PaginatedPostsList
          defaultPageSize={20}
          maxVisiblePages={5}
          searchKey={selectedUser ? '' : q}
          userId={selectedUser?._id}
          startDateRange={from || undefined}
          endDateRange={to || undefined}
          sortOrder={sortOrder || undefined}
          interactions={interactions}
          friendsOnly={isLoggedIn ? friends : false}
          onTotalCountChange={setTotalCount}
        />
      </div>

      {/* Guest sections */}
      <div className="max-w-2xl mx-auto px-4">
        <SearchGuestSections />
      </div>

      {/* Create Quote Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="max-w-md p-0" showCloseButton={false}>
          <SubmitPost setOpen={setSubmitDialogOpen} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
