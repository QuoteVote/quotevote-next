'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, ChevronDown } from 'lucide-react'

/**
 * DateSearchBar component
 *
 * Collapsible date range filter that syncs from/to values to URL search params.
 */
export default function DateSearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('from', e.target.value)
    } else {
      params.delete('from')
    }
    router.replace(`?${params.toString()}`)
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('to', e.target.value)
    } else {
      params.delete('to')
    }
    router.replace(`?${params.toString()}`)
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <Calendar className="h-4 w-4" />
        Date Range
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="flex gap-4 mt-2">
          <div>
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={handleFromChange}
              className="w-40"
            />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={handleToChange}
              className="w-40"
            />
          </div>
        </div>
      )}
    </div>
  )
}
