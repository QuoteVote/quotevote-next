"use client"


import ContentList, { ContentItem } from '@/components/ContentList'

// Mock Data
const MOCK_DATA: ContentItem[] = Array.from({ length: 15 }).map((_, i) => ({
    id: `item-${i}`,
    title: `Content Item Title ${i + 1}`,
    content: `This is a summary of content item ${i + 1}. It is migrated from the legacy system and now uses Tailwind CSS and shadcn/ui. The quick brown fox jumps over the lazy dog.`,
    upvotes: Math.floor(Math.random() * 100),
    downvotes: Math.floor(Math.random() * 20),
    url: `https://example.com/post/${i + 1}`,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    author: `User ${i + 1}`,
}))

export default function TestContentListPage() {
    return (
        <div className="container mx-auto py-10 px-4">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">ContentList Component Demo</h1>
                <p className="text-muted-foreground">
                    Migration of ContentList.jsx to TypeScript + shadcn/ui (Issue #60)
                </p>
            </div>

            <div className="mb-12">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Default State</h2>
                <ContentList data={MOCK_DATA} />
            </div>

            <div className="mb-12">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Loading State</h2>
                <ContentList data={[]} isLoading={true} />
            </div>

            <div className="mb-12">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Error State</h2>
                <ContentList data={[]} error="Failed to load content. Please try again later." />
            </div>

            <div className="mb-12">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Empty State</h2>
                <ContentList data={[]} />
            </div>
        </div>
    )
}
