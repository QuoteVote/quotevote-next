'use client'

import { useEffect, useState, startTransition } from 'react'
import { useQuery } from '@apollo/client/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GET_LATEST_QUOTES } from '@/graphql/queries'
import type { LatestQuotesProps, Quote } from '@/types/components'

export function LatestQuotes({ limit = 5 }: LatestQuotesProps) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const { data } = useQuery(GET_LATEST_QUOTES, {
    variables: { limit },
    pollInterval: 3000,
    fetchPolicy: 'network-only',
  })

  useEffect(() => {
    if (data && (data as { latestQuotes?: Quote[] }).latestQuotes) {
      const latestQuotes = (data as { latestQuotes: Quote[] }).latestQuotes
      startTransition(() => {
        setQuotes((prev) => {
          const existingIds = prev.map((q) => q._id)
          const fresh = latestQuotes.filter(
            (q: Quote) => !existingIds.includes(q._id)
          )
          return [...fresh, ...prev]
        })
      })
    }
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Quotes</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {quotes.map((q) => (
            <li key={q._id} className="block">
              <p className="text-sm">
                <strong>{q.user?.username}</strong>: {q.quote}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

