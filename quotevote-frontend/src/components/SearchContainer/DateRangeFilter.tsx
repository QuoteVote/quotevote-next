'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DateRangeFilterProps {
  startDate: string
  endDate: string
  onDateChange: (from: string, to: string) => void
}

const quickRanges = [
  {
    label: 'Past Day',
    getValue: () => {
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      return {
        from: yesterday.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0],
      }
    },
  },
  {
    label: 'Past Week',
    getValue: () => {
      const now = new Date()
      const start = new Date(now)
      start.setDate(now.getDate() - 7)
      return { from: start.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
    },
  },
  {
    label: 'Past Month',
    getValue: () => {
      const now = new Date()
      const start = new Date(now)
      start.setMonth(now.getMonth() - 1)
      return { from: start.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
    },
  },
]

export default function DateRangeFilter({ startDate, endDate, onDateChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false)
  const [localFrom, setLocalFrom] = useState(startDate)
  const [localTo, setLocalTo] = useState(endDate)
  const ref = useRef<HTMLDivElement>(null)

  /* eslint-disable react-hooks/set-state-in-effect -- syncing controlled props */
  useEffect(() => {
    setLocalFrom(startDate)
    setLocalTo(endDate)
  }, [startDate, endDate])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasRange = !!(startDate || endDate)

  const applyRange = (from: string, to: string) => {
    onDateChange(from, to)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger — matches the other filter icon buttons */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Filter by date range"
        className={cn(
          'flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border transition-all shadow-sm min-w-[60px] hover:scale-[1.02] cursor-pointer',
          hasRange || open
            ? 'border-primary bg-primary/10'
            : 'border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/40'
        )}
      >
        <span className="text-lg leading-none">📅</span>
        <span className="text-[10px] font-medium">{hasRange ? 'Dates' : 'Date'}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg p-3 w-64">
          {/* Quick ranges */}
          <div className="flex gap-1.5 mb-3">
            {quickRanges.map(({ label, getValue }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  const { from, to } = getValue()
                  setLocalFrom(from)
                  setLocalTo(to)
                  applyRange(from, to)
                }}
                className="px-2.5 py-1 rounded-full bg-muted text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="h-px bg-border mb-3" />

          {/* Date inputs */}
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                From
              </label>
              <input
                type="date"
                value={localFrom}
                max={localTo || undefined}
                onChange={(e) => setLocalFrom(e.target.value)}
                className="w-full mt-0.5 px-2 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                To
              </label>
              <input
                type="date"
                value={localTo}
                min={localFrom || undefined}
                onChange={(e) => setLocalTo(e.target.value)}
                className="w-full mt-0.5 px-2 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <Button
              type="button"
              size="sm"
              variant="default"
              className="flex-1 text-xs h-7"
              onClick={() => applyRange(localFrom, localTo)}
              disabled={!localFrom && !localTo}
            >
              Apply
            </Button>
            {hasRange && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-xs h-7"
                onClick={() => {
                  setLocalFrom('')
                  setLocalTo('')
                  applyRange('', '')
                }}
              >
                <X className="size-3" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
