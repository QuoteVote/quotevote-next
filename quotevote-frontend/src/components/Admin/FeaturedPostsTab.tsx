'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Search, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GET_TOP_POSTS } from '@/graphql/queries'
import { UPDATE_FEATURED_SLOT } from '@/graphql/mutations'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'

interface PostEntity {
  _id: string
  title: string
  text?: string
  featuredSlot?: number
}

export default function FeaturedPostsTab() {
  const { data, loading, error, refetch } = useQuery<{
    posts: { entities: PostEntity[]; pagination: { total_count: number } }
  }>(GET_TOP_POSTS, {
    variables: {
      limit: 50,
      offset: 0,
      searchKey: '',
      startDateRange: null,
      endDateRange: null,
      friendsOnly: false,
      interactions: false,
    },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  })

  const [updateSlot, { loading: saving }] = useMutation(UPDATE_FEATURED_SLOT)
  const [selection, setSelection] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState('')

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Featured Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Featured Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const posts: PostEntity[] = data.posts?.entities || []
  const usedSlots: Record<number, string> = {}
  posts.forEach((p) => {
    if (p.featuredSlot) usedSlots[p.featuredSlot] = p._id
  })

  const filteredPosts = posts.filter((p) => {
    const q = filter.toLowerCase()
    return (
      p.title.toLowerCase().includes(q) ||
      (p.text || '').toLowerCase().includes(q) ||
      p._id.includes(q)
    )
  })

  const handleSave = async (id: string) => {
    const slot = selection[id]
    try {
      await updateSlot({
        variables: { postId: id, featuredSlot: slot ? Number(slot) : null },
      })
      toast.success(slot ? `Post assigned to slot ${slot}` : 'Post removed from featured')
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update slot'
      toast.error(replaceGqlError(message))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Featured Posts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Filter posts by title or ID..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-medium">No posts match the filter</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try a different search term
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead className="w-[140px]">Slot</TableHead>
                    <TableHead className="text-right w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => {
                    const isAssigned = Boolean(post.featuredSlot)
                    return (
                      <TableRow
                        key={post._id}
                        className={isAssigned ? 'bg-primary/5' : ''}
                      >
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {post.title}
                          {isAssigned && (
                            <Badge variant="default" className="ml-2 text-xs">
                              #{post.featuredSlot}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">
                          {(post.text || '').slice(0, 100) || '—'}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={
                              selection[post._id] ??
                              (post.featuredSlot ? String(post.featuredSlot) : '')
                            }
                            onValueChange={(value) =>
                              setSelection((s) => ({ ...s, [post._id]: value }))
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                                <SelectItem
                                  key={n}
                                  value={String(n)}
                                  disabled={
                                    !!(usedSlots[n] && usedSlots[n] !== post._id)
                                  }
                                >
                                  Slot {n}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleSave(post._id)}
                            disabled={saving}
                          >
                            {saving && <Loader2 className="mr-1 size-3 animate-spin" />}
                            {isAssigned ? 'Update' : 'Assign'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filteredPosts.map((post) => {
                const isAssigned = Boolean(post.featuredSlot)
                return (
                  <div
                    key={post._id}
                    className={`rounded-lg border p-4 space-y-3 ${isAssigned ? 'bg-primary/5' : ''}`}
                  >
                    <p className="font-medium text-sm line-clamp-2">
                      {post.title}
                      {isAssigned && (
                        <Badge variant="default" className="ml-2 text-xs">
                          #{post.featuredSlot}
                        </Badge>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {(post.text || '').slice(0, 140) || '—'}
                    </p>
                    <div className="flex items-center gap-2">
                      <Select
                        value={
                          selection[post._id] ??
                          (post.featuredSlot ? String(post.featuredSlot) : '')
                        }
                        onValueChange={(value) =>
                          setSelection((s) => ({ ...s, [post._id]: value }))
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="No slot" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                            <SelectItem
                              key={n}
                              value={String(n)}
                              disabled={!!(usedSlots[n] && usedSlots[n] !== post._id)}
                            >
                              Slot {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => handleSave(post._id)}
                        disabled={saving}
                      >
                        {isAssigned ? 'Update' : 'Assign'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
