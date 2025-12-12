'use client'

import { LatestQuotes } from '@/components/Quotes'

export default function QuotesTestPage() {
  return (
    <div className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Quotes Component Test</h1>
          <p className="text-muted-foreground">
            Test the LatestQuotes component with different formats and states.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Verify quotes are fetched and displayed correctly</li>
            <li>Check that new quotes appear at the top (polling every 3 seconds)</li>
            <li>Verify username and quote text are displayed properly</li>
            <li>Test with different limit values</li>
            <li>Check layout, spacing, and styling</li>
            <li>Verify component handles empty state gracefully</li>
            <li>Test responsive design on different screen sizes</li>
          </ol>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Default Limit (5 quotes)</h3>
            <LatestQuotes />
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Custom Limit (10 quotes)</h3>
            <LatestQuotes limit={10} />
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Small Limit (3 quotes)</h3>
            <LatestQuotes limit={3} />
          </div>
        </div>

        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h3 className="text-xl font-semibold">Component Features</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Real-time quote updates via GraphQL polling (3s interval)</li>
            <li>Automatic deduplication of quotes</li>
            <li>shadcn/ui Card component for consistent styling</li>
            <li>Tailwind CSS for responsive layout</li>
            <li>TypeScript type safety</li>
            <li>Configurable quote limit</li>
            <li>Clean, readable quote display format</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

