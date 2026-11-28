'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface DateRangeFilterProps {
  startDate: string
  endDate: string
  onDateChange: (from: string, to: string) => void
}

type QuickRangeKey = 'day' | 'week' | 'month'

const QUICK_RANGES: { key: QuickRangeKey; label: string; getValue: () => { from: string; to: string } }[] = [
  {
    key: 'day',
    label: 'Past day',
    getValue: () => {
      const now = new Date()
      const start = new Date(now)
      start.setDate(now.getDate() - 1)
      return {
        from: start.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0],
      }
    },
  },
  {
    key: 'week',
    label: 'Past week',
    getValue: () => {
      const now = new Date()
      const start = new Date(now)
      start.setDate(now.getDate() - 7)
      return {
        from: start.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0],
      }
    },
  },
  {
    key: 'month',
    label: 'Past month',
    getValue: () => {
      const now = new Date()
      const start = new Date(now)
      start.setMonth(now.getMonth() - 1)
      return {
        from: start.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0],
      }
    },
  },
]

function detectActiveQuickRange(from: string, to: string): QuickRangeKey | null {
  if (!from || !to) return null
  for (const r of QUICK_RANGES) {
    const v = r.getValue()
    if (v.from === from && v.to === to) return r.key
  }
  return null
}

export default function DateRangeFilter({ startDate, endDate, onDateChange }: DateRangeFilterProps) {
  const [localFrom, setLocalFrom] = useState(startDate)
  const [localTo, setLocalTo] = useState(endDate)

  /* eslint-disable react-hooks/set-state-in-effect -- syncing controlled props */
  useEffect(() => {
    setLocalFrom(startDate)
    setLocalTo(endDate)
  }, [startDate, endDate])
  /* eslint-enable react-hooks/set-state-in-effect */

  const activeQuick = detectActiveQuickRange(startDate, endDate)

  const applyQuickRange = (key: QuickRangeKey) => {
    if (activeQuick === key) {
      onDateChange('', '')
      return
    }
    const range = QUICK_RANGES.find((r) => r.key === key)
    if (!range) return
    const { from, to } = range.getValue()
    onDateChange(from, to)
  }

  const handleFromChange = (value: string) => {
    setLocalFrom(value)
    onDateChange(value, localTo)
  }

  const handleToChange = (value: string) => {
    setLocalTo(value)
    onDateChange(localFrom, value)
  }

  return (
    <div className="space-y-2.5">
      {/* Quick range chips — match the look of the checkbox rows above */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_RANGES.map(({ key, label }) => {
          const isActive = activeQuick === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => applyQuickRange(key)}
              aria-pressed={isActive}
              className={cn(
                'inline-flex min-h-8 items-center rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274]',
                isActive
                  ? 'border-[#2f7a4c] bg-[#52b274]/10 text-[#2f6f4a] dark:border-[#7fdc9c] dark:text-[#7fdc9c]'
                  : 'border-[#8a8a93] bg-background text-foreground hover:bg-muted/60 dark:border-[#6e7681]'
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Custom range inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label
            htmlFor="filter-date-from"
            className="block text-[11px] font-semibold uppercase tracking-wider text-foreground/75"
          >
            From
          </label>
          <input
            id="filter-date-from"
            type="date"
            value={localFrom}
            max={localTo || undefined}
            onChange={(e) => handleFromChange(e.target.value)}
            className="min-h-9 w-full rounded-md border border-[#8a8a93] bg-background px-2 py-1.5 text-base text-foreground sm:text-sm focus:border-[#2f7a4c] focus:outline-none focus:ring-2 focus:ring-[#52b274]/40 dark:border-[#6e7681] dark:focus:border-[#7fdc9c]"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="filter-date-to"
            className="block text-[11px] font-semibold uppercase tracking-wider text-foreground/75"
          >
            To
          </label>
          <input
            id="filter-date-to"
            type="date"
            value={localTo}
            min={localFrom || undefined}
            onChange={(e) => handleToChange(e.target.value)}
            className="min-h-9 w-full rounded-md border border-[#8a8a93] bg-background px-2 py-1.5 text-base text-foreground sm:text-sm focus:border-[#2f7a4c] focus:outline-none focus:ring-2 focus:ring-[#52b274]/40 dark:border-[#6e7681] dark:focus:border-[#7fdc9c]"
          />
        </div>
      </div>
    </div>
  )
}
