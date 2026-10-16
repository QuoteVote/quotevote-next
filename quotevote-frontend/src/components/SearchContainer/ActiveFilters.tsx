'use client'

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ActiveFilter {
  key: string
  label: string
  value: string
  onRemove: () => void
}

interface ActiveFiltersProps {
  filters: ActiveFilter[]
}

export default function ActiveFilters({ filters }: ActiveFiltersProps) {
  const active = filters.filter((f) => f.value)

  if (active.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {active.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="flex items-center gap-1 border-[#52b274]/40 bg-[#52b274]/10 text-[#52b274] pl-2 pr-1 py-0.5 text-[11px] font-medium"
        >
          <span className="opacity-80">{filter.label}:</span>
          <span>{filter.value}</span>
          <button
            type="button"
            onClick={filter.onRemove}
            className="ml-0.5 rounded-full hover:bg-[#52b274]/25 p-0.5 cursor-pointer"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="size-2.5" />
          </button>
        </Badge>
      ))}
    </div>
  )
}
