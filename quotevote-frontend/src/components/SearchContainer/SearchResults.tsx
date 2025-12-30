'use client'

import Link from 'next/link'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import type { SearchResultsProps } from '@/types/components'
import { cn } from '@/lib/utils'

/**
 * SearchResultsView Component
 * 
 * Displays search results for content and creators in categorized sections.
 * Shows loading state, error state, and empty state messages.
 * 
 * @param searchResults - Search results data from GraphQL query
 * @param isLoading - Whether the search is currently loading
 * @param isError - Error object if search failed
 */
export default function SearchResultsView({
  searchResults,
  isLoading = false,
  isError = null,
}: SearchResultsProps) {
  // Show error state
  if (isError) {
    return (
      <Card className="z-20 p-2">
        <CardContent className="p-4">
          <p className="text-sm text-destructive">
            An error has occurred.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="z-10 overflow-y-scroll h-full max-h-full">
      {/* Loading state */}
      {isLoading ? (
        <Card className="z-20 p-2">
          <CardContent className="flex items-center justify-center p-4">
            <LoadingSpinner size={24} />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Iterate over search result categories */}
          {Object.keys(searchResults).map((resultCategory, id) => {
            const category = searchResults[resultCategory as keyof typeof searchResults]

            // Handle array results
            if (!Array.isArray(category)) {
              return null
            }

            // Empty results
            if (category.length === 0) {
              let typename = ''
              switch (resultCategory) {
                case 'searchCreator':
                  typename = 'Username'
                  break
                case 'searchContent':
                  typename = 'Content'
                  break
                default:
                  typename = ''
                  break
              }

              return (
                <Card
                  key={`${resultCategory}${id}`}
                  className="z-10 flex flex-col bg-gray-50"
                >
                  <CardHeader className="table-cell text-ellipsis w-[100px] whitespace-nowrap bg-transparent text-base py-2 px-4 font-bold text-gray-500 border-b border-gray-200">
                    {typename}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">No Results</p>
                  </CardContent>
                </Card>
              )
            }

            // Results with data
            const isUser = resultCategory === 'searchCreator'
            const typename = category[0]?.__typename || (isUser ? 'User' : 'Content')

            return (
              <Card
                key={`${resultCategory}${id}`}
                className="z-10 flex flex-col bg-gray-50"
              >
                <CardHeader className="table-cell text-ellipsis w-[100px] whitespace-nowrap bg-transparent text-base py-2 px-4 font-bold text-gray-500 border-b border-gray-200">
                  {typename}
                </CardHeader>
                <CardContent className="w-full table-cell bg-white border-l border-gray-300 border-b-2 border-gray-200 rounded-b-md">
                  {category.map((content) => {
                    const result = isUser
                      ? (content as { name: string }).name
                      : (content as { title: string }).title
                    const link = isUser
                      ? `/${(content as { name: string }).name.replace(/\s/g, '')}`
                      : `/boards/${(content as { domain: { key: string; _id: string } }).domain.key}/content/${(content as { domain: { _id: string } }).domain._id}`

                    return (
                      <Link
                        key={(content as { _id: string })._id}
                        href={link}
                        className={cn(
                          'block p-5 border-b border-gray-100',
                          'hover:bg-gray-50 transition-colors',
                          'last:border-none'
                        )}
                      >
                        {result}
                      </Link>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}
          {/* End of results marker */}
          <div className="my-16 z-10">End of Results</div>
        </>
      )}
    </div>
  )
}



