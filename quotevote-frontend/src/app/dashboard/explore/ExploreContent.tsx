'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useQuery, useSubscription } from '@apollo/client/react'
import { Bell, SlidersHorizontal, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import PaginatedPostsList from '@/components/Post/PaginatedPostsList'
import { useAppStore } from '@/store'
import SearchGuestSections from '@/components/SearchContainer/SearchGuestSections'
import DateRangeFilter from '@/components/SearchContainer/DateRangeFilter'
import { SubmitPost } from '@/components/SubmitPost/SubmitPost'
import { Notification } from '@/components/Notifications/Notification'
import ChatContent from '@/components/Chat/ChatContent'
import { GET_NOTIFICATIONS } from '@/graphql/queries'
import { NEW_NOTIFICATION_SUBSCRIPTION } from '@/graphql/subscriptions'
import type { Notification as NotificationType } from '@/types/notification'

type SortOrder = 'desc' | 'asc' | ''

interface FilterPanelProps {
  isLoggedIn: boolean
  friends: boolean
  interactions: boolean
  sortOrder: SortOrder
  from: string
  to: string
  hasAnyFilter: boolean
  onToggleFriends: () => void
  onToggleInteractions: () => void
  onSortChange: (val: SortOrder) => void
  onDateChange: (from: string, to: string) => void
  onClearAll: () => void
}

function FilterPanel({
  isLoggedIn,
  friends,
  interactions,
  sortOrder,
  from,
  to,
  hasAnyFilter,
  onToggleFriends,
  onToggleInteractions,
  onSortChange,
  onDateChange,
  onClearAll,
}: FilterPanelProps) {
  const sortOptions: { value: SortOrder; label: string }[] = [
    { value: '', label: 'Default' },
    { value: 'desc', label: 'Newest first' },
    { value: 'asc', label: 'Oldest first' },
  ]

  return (
    <div className="shrink-0 border-t border-border px-4 py-4 space-y-4 bg-background">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground/60" />
          <span className="text-sm font-semibold text-foreground/80">Filters</span>
        </div>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="size-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Toggle filters */}
      <div className="space-y-2.5">
        {isLoggedIn && (
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <Checkbox
              checked={friends}
              onCheckedChange={onToggleFriends}
              id="filter-friends"
            />
            <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors select-none">
              Friends only
            </span>
          </label>
        )}
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <Checkbox
            checked={interactions}
            onCheckedChange={onToggleInteractions}
            id="filter-popular"
          />
          <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors select-none">
            Most popular
          </span>
        </label>
      </div>

      {/* Sort order */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sort</p>
        <div className="space-y-2">
          {sortOptions.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
              <Checkbox
                checked={sortOrder === value}
                onCheckedChange={() => onSortChange(value)}
                id={`sort-${value || 'default'}`}
              />
              <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors select-none">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date range</p>
        <DateRangeFilter startDate={from} endDate={to} onDateChange={onDateChange} />
      </div>
    </div>
  )
}

interface LeftSidebarProps extends FilterPanelProps {
  userId: string | undefined
}

function LeftSidebar(props: LeftSidebarProps) {
  const { userId, ...filterProps } = props

  const { loading, data, refetch } = useQuery(GET_NOTIFICATIONS, {
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  })

  useSubscription(NEW_NOTIFICATION_SUBSCRIPTION, {
    variables: { userId: userId || '' },
    skip: !userId,
    onData: async () => { await refetch() },
  })

  const notifications: NotificationType[] =
    loading || !data
      ? []
      : (data as { notifications?: NotificationType[] }).notifications || []

  return (
    /* No overflow-hidden here so DateRangeFilter dropdown can escape */
    <div className="sticky top-[60px] h-[calc(100vh-60px)] flex flex-col">

      {/* ── Notifications ── */}
      {userId && (
        <>
          <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-background">
            <Bell className="size-4 text-muted-foreground/60" />
            <span className="text-sm font-semibold text-foreground/80">Notifications</span>
            {notifications.length > 0 && (
              <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none shadow">
                {notifications.length > 99 ? '99+' : notifications.length}
              </span>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 bg-background">
            <Notification
              loading={loading}
              notifications={notifications}
              refetch={refetch}
              pageView
            />
          </div>
        </>
      )}

      {/* ── Filters ── (always visible, pushes to bottom when notifications present) */}
      <FilterPanel {...filterProps} />
    </div>
  )
}

export default function ExploreContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAppStore((state) => state.user.data)
  const isLoggedIn = !!(user?._id || user?.id)
  const userId = (user?._id || user?.id) as string | undefined

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
        if (val !== null && val !== '') params.set(key, val)
        else params.delete(key)
      })
      router.replace(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleDateChange = useCallback(
    (newFrom: string, newTo: string) => updateParams({ from: newFrom || null, to: newTo || null }),
    [updateParams]
  )

  const handleSortChange = useCallback(
    (val: SortOrder) => updateParams({ sort: val || null }),
    [updateParams]
  )

  const handleToggleInteractions = useCallback(
    () => updateParams({ interactions: interactions ? null : 'true' }),
    [interactions, updateParams]
  )

  const handleToggleFriends = useCallback(
    () => updateParams({ friends: friends ? null : 'true' }),
    [friends, updateParams]
  )

  const handleClearAll = useCallback(
    () => updateParams({ friends: null, interactions: null, sort: null, from: null, to: null }),
    [updateParams]
  )

  const hasDateFilter = !!(from || to)
  const hasAnyFilter = interactions || friends || sortOrder !== '' || hasDateFilter || !!q

  const filterProps: FilterPanelProps = {
    isLoggedIn,
    friends,
    interactions,
    sortOrder,
    from,
    to,
    hasAnyFilter,
    onToggleFriends: handleToggleFriends,
    onToggleInteractions: handleToggleInteractions,
    onSortChange: handleSortChange,
    onDateChange: handleDateChange,
    onClearAll: handleClearAll,
  }

  return (
    <div className="-mx-4 -mt-6 md:-mx-4 flex min-h-screen">

      {/* ── Left: Notifications + Filters ────────────────────────────── */}
      <aside className="hidden lg:block w-[300px] xl:w-[340px] shrink-0 border-r border-border bg-background">
        <LeftSidebar userId={isLoggedIn ? userId : undefined} {...filterProps} />
      </aside>

      {/* ── Center: Posts feed ────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">

        {/* Logo + tagline */}
        <div className="flex flex-col items-center py-8 px-4 border-b border-border">
          <Image
            src="/assets/QuoteVoteLogo.png"
            alt="QuoteVote"
            width={200}
            height={60}
            className="mb-3 dark:hidden"
            priority
          />
          <span className="hidden dark:block mb-3 text-[2.5rem] font-black tracking-tight text-white leading-none select-none">
            QUOTE.VOTE
          </span>
          <p className="text-sm text-muted-foreground text-center">
            No algorithms. No ads. Just conversations.
          </p>
        </div>

        {/* Active filter summary pills — visible on mobile where sidebar is hidden */}
        {hasAnyFilter && (
          <div className="lg:hidden px-4 py-2 border-b border-border flex flex-wrap gap-1.5 text-xs">
            {q && (
              <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                🔍 &quot;{q}&quot;
              </span>
            )}
            {friends && (
              <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                Friends Only
              </span>
            )}
            {interactions && (
              <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                Most Popular
              </span>
            )}
            {sortOrder === 'desc' && (
              <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                Newest First
              </span>
            )}
            {sortOrder === 'asc' && (
              <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                Oldest First
              </span>
            )}
            {hasDateFilter && (
              <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                📅 {from || '…'} — {to || '…'}
              </span>
            )}
          </div>
        )}

        {/* Result count */}
        {totalCount > 0 && hasAnyFilter && (
          <div className="px-4 pt-3">
            <p className="text-sm font-medium text-muted-foreground text-center">
              {totalCount.toLocaleString()} {totalCount === 1 ? 'result' : 'results'} found
            </p>
          </div>
        )}

        {/* Posts feed */}
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

        {/* Guest sections */}
        <div className="px-4">
          <SearchGuestSections />
        </div>
      </div>

      {/* ── Right: Messaging panel (xl+ only) ────────────────────────── */}
      {isLoggedIn && (
        <aside className="hidden xl:flex flex-col w-[360px] 2xl:w-[420px] shrink-0 border-l border-border bg-background">
          <div className="sticky top-[60px] h-[calc(100vh-60px)] overflow-hidden flex flex-col">
            <ChatContent />
          </div>
        </aside>
      )}

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
