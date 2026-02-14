'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useQuery } from '@apollo/client/react'

import { SEARCH } from '@/graphql/queries'
import { useDebounce } from '@/hooks/useDebounce'
import { Input } from '@/components/ui/input'
import { Card, CardHeader } from '@/components/ui/card'
import SearchResultsView from './SearchResults'
import type { SidebarSearchViewProps } from '@/types/components'
import { cn } from '@/lib/utils'

interface SearchContent {
  _id: string
  title: string
  creatorId: string
  domain: {
    key: string
    _id: string
  }
}

interface SearchCreator {
  _id: string
  name: string
  avatar?: string
  creator: {
    _id: string
  }
}

interface SearchQueryData {
  searchContent: SearchContent[]
  searchCreator: SearchCreator[]
}

/**
 * SidebarSearchView Component
 * 
 * A search container component that provides a search input with debounced queries
 * and displays search results for content and creators.
 * 
 * @param Display - Display style for the container (default: 'block')
 */
export default function SidebarSearchView({ Display = 'block' }: SidebarSearchViewProps) {
  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText, 300)

  const { loading, error, data } = useQuery<SearchQueryData>(SEARCH, {
    variables: { text: debouncedSearchText },
    skip: !debouncedSearchText.trim(),
  })

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
  }

  return (
    <div
      className={cn(
        'flex-1',
        Display === 'flex' ? 'flex' : Display === 'none' ? 'hidden' : 'block',
        'm-1 mr-4',
        'h-[90vh]'
      )}
    >
      <Card className="z-10 h-fit">
        <CardHeader className="bg-white m-1 pl-0 pr-1">
          <div className="relative rounded-md bg-white/15 hover:bg-white/25 mr-2 ml-0 w-full sm:ml-2 sm:w-auto">
            <div className="absolute inset-y-0 left-0 flex items-center justify-center pointer-events-none pl-3">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <Input
              type="text"
              placeholder="Search…"
              value={searchText}
              onChange={handleTextChange}
              className="pl-10 w-full sm:w-[20ch]"
              aria-label="search"
            />
          </div>
        </CardHeader>
      </Card>
      {data && (
        <SearchResultsView
          searchResults={data}
          isLoading={loading}
          isError={error || null}
        />
      )}
    </div>
  )
}


