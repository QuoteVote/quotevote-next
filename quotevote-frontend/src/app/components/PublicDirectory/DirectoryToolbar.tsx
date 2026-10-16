'use client'

import { useCallback, useEffect, useState, type ReactElement } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, Clock, ListFilter, Search as SearchIcon, Users } from 'lucide-react'
import { useQuery } from '@apollo/client/react'
import { useDebounce } from '@/hooks/useDebounce'
import { GET_GROUP } from '@/graphql/queries'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import DateRangeFilter from '@/components/SearchContainer/DateRangeFilter'
import ActiveFilters from '@/components/SearchContainer/ActiveFilters'

type SortOrder = 'desc' | 'asc'

interface GroupQueryData {
  group?: { _id: string; title: string }
}

function chipClass(active: boolean): string {
  return cn(
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium shrink-0 transition-colors',
    active
      ? 'border-[#52b274]/40 bg-[#52b274]/10 text-[#52b274]'
      : 'border-border bg-background text-foreground hover:bg-muted/60'
  )
}

/**
 * Search + filter chips for the public directory.
 * Chips wrap instead of scrolling sideways (no horizontal overflow).
 */
export function DirectoryToolbar(): ReactElement {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAppStore((s) => s.user.data)
  const isLoggedIn = !!(user?._id || user?.id)

  const q = searchParams.get('q') || ''
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const sortOrder = (searchParams.get('sort') || 'desc') as SortOrder
  const interactions = searchParams.get('interactions') === 'true'
  const following = searchParams.get('following') === 'true'
  const groupId = searchParams.get('group') || ''

  const [searchInput, setSearchInput] = useState(q)
  const debouncedSearch = useDebounce(searchInput, 300)

  const { data: groupData } = useQuery<GroupQueryData>(GET_GROUP, {
    variables: { groupId },
    skip: !groupId,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  })

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, val]) => {
        if (val !== null && val !== '') params.set(key, val)
        else params.delete(key)
      })
      params.delete('page')
      const query = params.toString()
      router.replace(query ? `?${query}` : '/', { scroll: false })
    },
    [router, searchParams]
  )

  // Keyed on the debounced input only: removing the search pill clears `q` in the URL,
  // and re-running on `q` would re-apply the stale debounced text.
  useEffect(() => {
    if (debouncedSearch === q) return
    updateParams({ q: debouncedSearch.trim() || null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const isLatest = sortOrder === 'desc' && !interactions
  const hasDateFilter = !!(from || to)
  const today = new Date().toISOString().split('T')[0]
  const isToday = from === today && to === today
  const dateLabel = isToday ? 'Today' : 'Date'

  const handleLatest = () => {
    updateParams({ sort: 'desc', interactions: null })
  }

  const handleTogglePopular = () => {
    updateParams({
      interactions: interactions ? null : 'true',
      sort: interactions ? 'desc' : null,
    })
  }

  const groupTitle = groupData?.group?.title
  const activeFilters = [
    {
      key: 'q',
      label: 'Search',
      value: q,
      onRemove: () => {
        setSearchInput('')
        updateParams({ q: null })
      },
    },
    {
      key: 'following',
      label: 'Feed',
      value: following ? 'Following' : '',
      onRemove: () => updateParams({ following: null }),
    },
    {
      key: 'interactions',
      label: 'Sort',
      value: interactions ? 'Most popular' : '',
      onRemove: handleLatest,
    },
    {
      key: 'group',
      label: 'Tag',
      value: groupId ? (groupTitle ? `#${groupTitle}` : 'Selected') : '',
      onRemove: () => updateParams({ group: null }),
    },
    {
      key: 'date',
      label: 'Date',
      value: hasDateFilter ? (isToday ? 'Today' : [from, to].filter(Boolean).join(' – ')) : '',
      onRemove: () => updateParams({ from: null, to: null }),
    },
  ]

  return (
    <div
      data-testid="directory-toolbar"
      className="w-full max-w-2xl mx-auto px-4 pt-3 pb-2 space-y-3 min-w-0 bg-background"
    >
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          updateParams({ q: searchInput.trim() || null })
        }}
      >
        <label htmlFor="directory-search" className="sr-only">
          Search quotes, topics, sources, or use #hashtag
        </label>
        <div className="relative">
          <SearchIcon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <input
            id="directory-search"
            data-testid="directory-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search quotes, topics, sources… or use #hashtag"
            aria-describedby="directory-search-tip"
            className="w-full h-11 rounded-full border border-border bg-background pl-10 pr-4 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#52b274]/40"
          />
        </div>
        <p id="directory-search-tip" className="mt-1.5 px-3.5 text-xs text-muted-foreground">
          Tip: use #hashtag to filter by tag, @username for people.
        </p>
      </form>

      <div className="flex flex-wrap items-center gap-1 md:gap-2 min-w-0">
        <button
          type="button"
          data-testid="filter-latest"
          aria-pressed={isLatest}
          onClick={handleLatest}
          className={chipClass(isLatest)}
        >
          <Clock className="size-3.5" aria-hidden />
          Latest
        </button>

        {isLoggedIn ? (
          <button
            type="button"
            data-testid="filter-following"
            aria-pressed={following}
            onClick={() => updateParams({ following: following ? null : 'true' })}
            className={chipClass(following)}
          >
            <Users className="size-3.5" aria-hidden />
            Following
          </button>
        ) : null}

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              data-testid="filter-filters"
              aria-pressed={interactions}
              className={chipClass(interactions)}
            >
              <ListFilter className="size-3.5" aria-hidden />
              Filters
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox
                checked={interactions}
                onCheckedChange={handleTogglePopular}
                id="directory-filter-popular"
              />
              <span className="text-sm">Most popular</span>
            </label>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              data-testid="filter-date"
              aria-pressed={hasDateFilter}
              className={chipClass(hasDateFilter)}
            >
              <Calendar className="size-3.5" aria-hidden />
              {dateLabel}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-3">
            <DateRangeFilter
              startDate={from}
              endDate={to}
              onDateChange={(newFrom, newTo) =>
                updateParams({ from: newFrom || null, to: newTo || null })
              }
            />
          </PopoverContent>
        </Popover>
      </div>

      <ActiveFilters filters={activeFilters} />
    </div>
  )
}
