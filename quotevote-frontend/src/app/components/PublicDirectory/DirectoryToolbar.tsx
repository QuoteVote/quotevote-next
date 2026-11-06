'use client'

import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, ListFilter } from 'lucide-react'
import { useQuery } from '@apollo/client/react'
import { useDebounce } from '@/hooks/useDebounce'
import { GET_TAG, TAGS_QUERY } from '@/graphql/queries'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import DateRangeFilter from '@/components/SearchContainer/DateRangeFilter'
import ActiveFilters from '@/components/SearchContainer/ActiveFilters'
import { DirectorySearch } from './DirectorySearch'
import { DirectoryFiltersPanel } from './DirectoryFiltersPanel'
import type { Tag } from '@/types/components'
import type { DirectorySort, DirectoryTopic } from '@/types/directory'

interface TagsQueryData {
  tags: Tag[]
}

interface TagQueryData {
  tag?: { _id: string; title: string }
}

function controlClass(active: boolean): string {
  return cn(
    'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] focus-visible:ring-offset-1 focus-visible:ring-offset-background',
    active
      ? 'border-[#2f7a4c] bg-[#52b274]/10 text-[#2f6f4a] dark:border-[#7fdc9c] dark:text-[#7fdc9c]'
      : 'border-[#8a8a93] bg-background text-foreground hover:bg-muted/60 dark:border-[#6e7681]'
  )
}

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Home page discovery (#515): Search first, then Filters (sort, Following,
 * topic) and Date range. Every control changes the same URL-driven results,
 * and the active filters are listed underneath so it's clear why posts show.
 * Controls wrap instead of scrolling sideways (no horizontal overflow).
 */
export function DirectoryToolbar(): ReactElement {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAppStore((s) => s.user.data)
  const isLoggedIn = !!(user?._id || user?.id)

  const q = searchParams.get('q') || ''
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const interactions = searchParams.get('interactions') === 'true'
  const following = searchParams.get('following') === 'true'
  const tagId = searchParams.get('group') || ''

  const [searchInput, setSearchInput] = useState(q)
  const debouncedSearch = useDebounce(searchInput, 300)

  // When the search is cleared from outside the box (the empty results' "Clear search and
  // filters"), empty the box too. Only clearing is synced, so typing is never overwritten.
  const [prevQ, setPrevQ] = useState(q)
  if (q !== prevQ) {
    setPrevQ(q)
    if (!q && searchInput) setSearchInput('')
  }

  const { data: tagData } = useQuery<TagQueryData>(GET_TAG, {
    variables: { tagId },
    skip: !tagId,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  })

  const { data: tagsData } = useQuery<TagsQueryData>(TAGS_QUERY, {
    variables: { limit: 100 },
    errorPolicy: 'all',
  })
  const publicTags = (tagsData?.tags ?? []).filter((tag) => tag.privacy !== 'private')
  const topics: DirectoryTopic[] = publicTags.map((tag) => ({ _id: tag._id, title: tag.title }))
  const [filtersOpen, setFiltersOpen] = useState(false)

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

  // A lone `#word` that names a tag applies the tag filter (same as the tag badges); anything else is text search.
  const lastApplied = useRef(q)
  const applySearch = useCallback(
    (raw: string) => {
      const text = raw.trim()
      lastApplied.current = raw
      const tag = /^#(\S+)$/.exec(text)?.[1]?.toLowerCase()
      const selectedTag = tag ? publicTags.find((item) => item.title.toLowerCase() === tag) : undefined
      if (selectedTag) {
        setSearchInput('')
        updateParams({ group: selectedTag._id, q: null })
      } else {
        updateParams({ q: text || null })
      }
    },
    [publicTags, updateParams]
  )

  // Keyed on the debounced input only: removing the search pill clears `q` in the URL,
  // and re-running on `q` would re-apply the stale debounced text.
  // A `#word` that isn't a topic yet (still being typed) waits for a suggestion
  // or Enter instead of searching the text; an exact topic name applies at once.
  useEffect(() => {
    if (debouncedSearch === q || debouncedSearch === lastApplied.current) return
    const typedTag = /^\s*#(\S*)\s*$/.exec(debouncedSearch)?.[1]?.toLowerCase()
    if (typedTag !== undefined && !publicTags.some((tag) => tag.title.toLowerCase() === typedTag)) {
      return
    }
    applySearch(debouncedSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const sort: DirectorySort = interactions ? 'popular' : 'latest'
  const hasDateFilter = !!(from || to)
  const today = new Date().toISOString().split('T')[0]
  const isToday = from === today && to === today
  const dateValue = hasDateFilter
    ? isToday
      ? 'Today'
      : from && to
        ? `${formatDay(from)} – ${formatDay(to)}`
        : from
          ? `From ${formatDay(from)}`
          : `Until ${formatDay(to)}`
    : ''
  const activeFilterCount = (interactions ? 1 : 0) + (following ? 1 : 0) + (tagId ? 1 : 0)

  const handleSortChange = (next: DirectorySort) => {
    updateParams({ interactions: next === 'popular' ? 'true' : null, sort: null })
  }

  const clearFilters = () => {
    updateParams({ interactions: null, sort: null, following: null, group: null })
  }

  const clearAll = () => {
    setSearchInput('')
    lastApplied.current = ''
    updateParams({ q: null, interactions: null, sort: null, following: null, group: null, from: null, to: null })
  }

  const selectTopic = (topic: DirectoryTopic) => {
    setSearchInput('')
    lastApplied.current = ''
    updateParams({ group: topic._id, q: null })
  }

  const tagTitle = tagData?.tag?.title
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
      key: 'group',
      label: 'Topic',
      value: tagId ? (tagTitle ? `#${tagTitle}` : 'Selected') : '',
      onRemove: () => updateParams({ group: null }),
    },
    {
      key: 'interactions',
      label: 'Sort',
      value: interactions ? 'Most popular' : '',
      onRemove: () => handleSortChange('latest'),
    },
    {
      key: 'following',
      label: 'Feed',
      value: following ? 'Following' : '',
      onRemove: () => updateParams({ following: null }),
    },
    {
      key: 'date',
      label: 'Date',
      value: dateValue,
      onRemove: () => updateParams({ from: null, to: null }),
    },
  ]

  return (
    <div
      data-testid="directory-toolbar"
      className="w-full max-w-2xl mx-auto px-4 pt-3 pb-2 space-y-2.5 min-w-0 bg-background"
    >
      <DirectorySearch
        value={searchInput}
        onChange={setSearchInput}
        onSubmit={applySearch}
        topics={topics}
        onSelectTopic={selectTopic}
      />

      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              data-testid="filter-filters"
              aria-label={activeFilterCount ? `Filters, ${activeFilterCount} on` : 'Filters'}
              className={controlClass(activeFilterCount > 0)}
            >
              <ListFilter className="size-4" aria-hidden />
              Filters
              {activeFilterCount ? (
                <span
                  aria-hidden
                  className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#2f7a4c] px-1.5 text-[11px] font-bold leading-5 text-white"
                >
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-0">
            <DirectoryFiltersPanel
              sort={sort}
              onSortChange={handleSortChange}
              showFollowing={isLoggedIn}
              following={following}
              onFollowingChange={(next) => updateParams({ following: next ? 'true' : null })}
              topics={topics}
              topicId={tagId}
              onTopicChange={(id) => updateParams({ group: id || null })}
              onClear={clearFilters}
              onDone={() => setFiltersOpen(false)}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              data-testid="filter-date"
              aria-label={hasDateFilter ? `Date range, ${dateValue}` : 'Date range'}
              className={controlClass(hasDateFilter)}
            >
              <Calendar className="size-4" aria-hidden />
              {hasDateFilter ? dateValue : 'Date range'}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[min(18rem,calc(100vw-2rem))] p-3">
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

      <ActiveFilters filters={activeFilters} onClearAll={clearAll} />
    </div>
  )
}
