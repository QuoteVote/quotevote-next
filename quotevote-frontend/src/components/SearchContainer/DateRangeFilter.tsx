'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DateRangeFilterProps {
  startDate: string
  endDate: string
  onDateChange: (from: string, to: string) => void
}

const quickRanges = [
  { label: 'Today', getValue: () => {
    const d = new Date()
    const iso = d.toISOString().split('T')[0]
    return { from: iso, to: iso }
  }},
  { label: 'This Week', getValue: () => {
    const now = new Date()
    const day = now.getDay()
    const start = new Date(now)
    start.setDate(now.getDate() - day)
    return { from: start.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
  }},
  { label: 'This Month', getValue: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: start.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
  }},
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
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasRange = startDate || endDate

  const applyRange = (from: string, to: string) => {
    onDateChange(from, to)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className={cn(
          'gap-1.5 text-xs rounded-full',
          hasRange && 'bg-primary/10 text-primary'
        )}
      >
        <Calendar className="size-3.5" />
        {hasRange ? 'Date Range' : 'Date'}
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg p-3 w-64">
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
                className="px-2.5 py-1 rounded-full bg-muted text-xs font-medium hover:bg-muted/80 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Date inputs */}
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">From</label>
              <input
                type="date"
                value={localFrom}
                onChange={(e) => setLocalFrom(e.target.value)}
                className="w-full mt-0.5 px-2 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">To</label>
              <input
                type="date"
                value={localTo}
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
