"use client"

import React, { useState, useMemo } from 'react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ChevronDown, ChevronUp, Share2, Heart, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react'

// Types
export interface ContentItemData {
    _id: string
    title: string
    text?: string
    upvotes: number
    downvotes: number
    url: string
    createdAt?: string // Optional for sorting
    [key: string]: any
}

interface ContentListProps {
    items: ContentItemData[]
    itemsPerPage?: number
}

const ContentItem = ({ item }: { item: ContentItemData }) => {
    const [expanded, setExpanded] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation()
        const domain = typeof window !== 'undefined' ? window.location.origin : ''
        navigator.clipboard.writeText(domain + item.url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Card className="mb-4 transition-all hover:shadow-md border-slate-200 dark:border-slate-800">
            <CardHeader className="cursor-pointer pb-2" onClick={() => setExpanded(!expanded)}>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            {item.title}
                        </CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-2">
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </CardHeader>

            {/* Stats Row - Always visible or visible in header? Original had it in summary */}
            <div className="px-6 pb-2 flex items-center justify-between text-sm text-muted-foreground" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>Comments</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-green-600 flex items-center"><ThumbsUp className="h-3 w-3 mr-1" /> {item.upvotes || 0}</span>
                        <span className="text-red-500 flex items-center"><ThumbsDown className="h-3 w-3 mr-1" /> {item.downvotes || 0}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy Link">
                        {copied ? <span className="text-xs font-bold text-green-500">Copied</span> : <Share2 className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Heart className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {expanded && (
                <CardContent className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {item.text || "No content available."}
                    </p>
                    {/* <p className="text-xs text-slate-400 mt-4">ID: {item._id}</p> */}
                </CardContent>
            )}
        </Card>
    )
}

export function ContentList({ items, itemsPerPage = 5 }: ContentListProps) {
    const [filterQuery, setFilterQuery] = useState('')
    const [sortOption, setSortOption] = useState<'newest' | 'votes' | 'title'>('newest')
    const [currentPage, setCurrentPage] = useState(1)

    // Filter and Sort
    const processedItems = useMemo(() => {
        let result = [...items]

        // Filter
        if (filterQuery) {
            const query = filterQuery.toLowerCase()
            result = result.filter(item =>
                (item.title && item.title.toLowerCase().includes(query)) ||
                (item.text && item.text.toLowerCase().includes(query))
            )
        }

        // Sort
        result.sort((a, b) => {
            if (sortOption === 'votes') {
                return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
            } else if (sortOption === 'title') {
                return a.title.localeCompare(b.title)
            } else {
                // Default newest (assuming createdAt exists or fallback to original order)
                if (a.createdAt && b.createdAt) {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                }
                return 0
            }
        })

        return result
    }, [items, filterQuery, sortOption])

    // Pagination
    const totalPages = Math.ceil(processedItems.length / itemsPerPage)
    const paginatedItems = processedItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage)
        }
    }

    if (!items) {
        return <div className="p-4 text-center">Loading content...</div>
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <div className="relative w-full md:w-1/2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                        placeholder="Search content..."
                        className="pl-10"
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    <Button
                        variant={sortOption === 'newest' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortOption('newest')}
                    >
                        Newest
                    </Button>
                    <Button
                        variant={sortOption === 'votes' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortOption('votes')}
                    >
                        Popular
                    </Button>
                    <Button
                        variant={sortOption === 'title' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortOption('title')}
                    >
                        A-Z
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {paginatedItems.length > 0 ? (
                    paginatedItems.map((item) => (
                        <ContentItem key={item._id || Math.random()} item={item} />
                    ))
                ) : (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                        <p className="text-muted-foreground">No content found matching your criteria.</p>
                        <Button variant="link" onClick={() => { setFilterQuery(''); setSortOption('newest') }}>Clear filters</Button>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-slate-500">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    )
}
