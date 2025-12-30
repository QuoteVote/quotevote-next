"use client"

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Heart,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export interface ContentItem {
  id: string
  title: string
  content: string // maps to 'text' from old component
  upvotes: number
  downvotes: number
  url: string
  createdAt?: string
  author?: string
}

export interface ContentListProps {
  data?: ContentItem[]
  isLoading?: boolean
  error?: string | null
}

const ITEMS_PER_PAGE = 5

// Extracted ContentCard component for better state management and reusability
interface ContentCardProps {
  item: ContentItem;
}

function ContentCard({ item }: ContentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold leading-none">
              <Link href={item.url || '#'} className="hover:underline hover:text-primary transition-colors">
                {item.title}
              </Link>
            </CardTitle>
            {item.createdAt && (
              <p className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-green-600 bg-green-50 dark:bg-green-900/10">
              <ThumbsUp className="w-3 h-3 mr-1" />
              {item.upvotes}
            </Badge>
            <Badge variant="secondary" className="text-red-600 bg-red-50 dark:bg-red-900/10">
              <ThumbsDown className="w-3 h-3 mr-1" />
              {item.downvotes}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative">
          <p className={cn(
            "text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap",
            !isExpanded && "line-clamp-3"
          )}>
            {item.content}
          </p>
          {(item.content.length > 150 || item.content.split('\n').length > 3) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs font-medium text-primary mt-1 hover:bg-transparent hover:underline"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <span className="flex items-center gap-1">Show less <ChevronUp className="w-3 h-3" /></span>
              ) : (
                <span className="flex items-center gap-1">Read more <ChevronDown className="w-3 h-3" /></span>
              )}
            </Button>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t bg-muted/20 flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Comments</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-pink-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/20">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(item.url, item.id)}
            className="gap-2"
          >
            {copiedId === item.id ? (
              <span className="text-green-600 font-medium text-xs">Copied!</span>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={item.url || '#'} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              Open
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function ContentList({
  data = [],
  isLoading = false,
  error = null
}: ContentListProps) {
  const [filterText, setFilterText] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter and Sort Logic
  const filteredAndSortedData = useMemo(() => {
    let result = [...data]

    // Filter
    if (filterText.trim()) {
      const lowerFilter = filterText.toLowerCase()
      result = result.filter(item =>
        item.title.toLowerCase().includes(lowerFilter) ||
        item.content.toLowerCase().includes(lowerFilter)
      )
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
      }
      if (sortBy === 'oldest') {
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }
        return 0
      }
      // Default: Newest
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      return 0
    })

    return result
  }, [data, filterText, sortBy])

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedData.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredAndSortedData, currentPage])

  // Reset page on filter change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filterText, sortBy])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size={40} />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {paginatedData.length > 0 ? (
          paginatedData.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No content found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
              We couldn't find any content matching your search filters. Try adjusting your search query.
            </p>
            <Button
              variant="link"
              onClick={() => { setFilterText(''); setSortBy('newest'); }}
              className="mt-4"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
