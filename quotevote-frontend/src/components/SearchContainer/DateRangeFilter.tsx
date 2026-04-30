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
                'px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors',
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-foreground/80 hover:bg-muted/60 hover:text-foreground'
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
            className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            From
          </label>
          <input
            id="filter-date-from"
            type="date"
            value={localFrom}
            max={localTo || undefined}
            onChange={(e) => handleFromChange(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/60"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="filter-date-to"
            className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            To
          </label>
          <input
            id="filter-date-to"
            type="date"
            value={localTo}
            min={localFrom || undefined}
            onChange={(e) => handleToChange(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/60"
          />
        </div>
      </div>
    </div>
  )
}
