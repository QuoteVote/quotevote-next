'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import PaginatedPostsList from '@/components/Post/PaginatedPostsList'
import { useAppStore } from '@/store'
import SearchGuestSections from '@/components/SearchContainer/SearchGuestSections'
import DateRangeFilter from '@/components/SearchContainer/DateRangeFilter'
import { SubmitPost } from '@/components/SubmitPost/SubmitPost'
import { cn } from '@/lib/utils'

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
  const sortOrder = (searchParams.get('sort') || '') as SortOrder
  const interactions = searchParams.get('interactions') === 'true'
  const friends = searchParams.get('friends') === 'true'

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

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

  const handleDateChange = useCallback(
    (newFrom: string, newTo: string) => {
      updateParams({ from: newFrom || null, to: newTo || null })
    },
    [updateParams]
  )

  const handleSortCycle = useCallback(() => {
    const next: SortOrder = sortOrder === '' ? 'desc' : sortOrder === 'desc' ? 'asc' : ''
    updateParams({ sort: next || null })
  }, [sortOrder, updateParams])

  const handleToggleInteractions = useCallback(() => {
    updateParams({ interactions: interactions ? null : 'true' })
  }, [interactions, updateParams])

  const handleToggleFriends = useCallback(() => {
    updateParams({ friends: friends ? null : 'true' })
  }, [friends, updateParams])

  const hasDateFilter = !!(from || to)
  const hasAnyFilter = interactions || friends || sortOrder !== '' || hasDateFilter || !!q

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
        {/* Light mode: PNG logo */}
        <Image
          src="/assets/QuoteVoteLogo.png"
          alt="QuoteVote"
          width={220}
          height={66}
          className="mb-3 dark:hidden"
          priority
        />
        {/* Dark mode: white text logo */}
        <span className="hidden dark:block mb-3 text-[2.75rem] font-black tracking-tight text-white leading-none select-none">
          QUOTE.VOTE
        </span>
        <p className="text-sm text-muted-foreground text-center">
          No algorithms. No ads. Just conversations.
        </p>
      </div>

      {/* ── Sticky filters ── */}
      <div className="sticky top-14 md:top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">

          {/* ── Filter icon buttons ── */}
          <div className="flex items-center justify-center gap-3">
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
                onClick={handleToggleFriends}
                title={friends ? 'Showing friends posts' : 'Show posts from people you follow'}
                className={filterIconBtn(friends)}
              >
                <span className="text-lg leading-none">👥</span>
                <span className="text-[10px] font-medium">Friends</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleInteractions}
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
              {q && (
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
          searchKey={q}
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
          <DialogTitle className="sr-only">Create Quote</DialogTitle>
          <SubmitPost setOpen={setSubmitDialogOpen} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
