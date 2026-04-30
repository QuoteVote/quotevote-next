'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Search, Loader2, AlertCircle, Star, FileText } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GET_TOP_POSTS } from '@/graphql/queries'
import { UPDATE_FEATURED_SLOT } from '@/graphql/mutations'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'
import { cn } from '@/lib/utils'

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
      <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-5">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="size-4" />
          <p className="text-sm font-semibold">Error loading posts</p>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    )
  }

  const posts: PostEntity[] = data.posts?.entities || []
  const usedSlots: Record<number, string> = {}
  posts.forEach((p) => {
    if (p.featuredSlot) usedSlots[p.featuredSlot] = p._id
  })

  const featuredCount = Object.keys(usedSlots).length

  const filteredPosts = posts.filter((p) => {
    const q = filter.toLowerCase()
    return (
      p.title.toLowerCase().includes(q) ||
      (p.text || '').toLowerCase().includes(q) ||
      p._id.includes(q)
    )
  })

  const handleSave = async (id: string) => {
    const post = posts.find((p) => p._id === id)
    const selected = selection[id]
    // Fall back to the post's current slot if admin didn't touch the dropdown
    const effectiveSlot = selected !== undefined ? selected : (post?.featuredSlot ? String(post.featuredSlot) : 'none')
    try {
      await updateSlot({
        variables: { postId: id, featuredSlot: effectiveSlot && effectiveSlot !== 'none' ? Number(effectiveSlot) : null },
      })
      toast.success(effectiveSlot && effectiveSlot !== 'none' ? `Post assigned to slot ${effectiveSlot}` : 'Post removed from featured')
      setSelection((s) => { const next = { ...s }; delete next[id]; return next })
      refetch()
    } catch (err) {
      toast.error(replaceGqlError(err instanceof Error ? err.message : 'Failed to update slot'))
    }
  }

  return (
    <div className="space-y-5">
      {/* Slot overview */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
          const isFilled = !!usedSlots[n]
          return (
            <div
              key={n}
              className={cn(
                'rounded-lg border p-2 text-center text-xs font-bold transition-colors',
                isFilled
                  ? 'bg-[#52b274]/10 border-[#52b274]/30 text-[#52b274]'
                  : 'border-border/60 text-muted-foreground/40'
              )}
            >
              {n}
              {isFilled && <div className="size-1.5 rounded-full bg-[#52b274] mx-auto mt-1" />}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-[#52b274]" />
          <span>{featuredCount} slots filled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-muted" />
          <span>{12 - featuredCount} available</span>
        </div>
      </div>

      {/* Posts table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {/* Search header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div>
            <h3 className="text-sm font-semibold">Posts</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{posts.length} posts available</p>
          </div>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center">
              <FileText className="size-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{filter ? 'No results found' : 'No posts'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {filter ? 'Try a different search term' : 'Posts will appear here once created'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Post</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[140px]">Featured Slot</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredPosts.map((post) => {
                    const isAssigned = Boolean(post.featuredSlot)
                    const currentSlot = selection[post._id] ?? (post.featuredSlot ? String(post.featuredSlot) : '')
                    return (
                      <tr
                        key={post._id}
                        className={cn(
                          'transition-colors',
                          isAssigned ? 'bg-[#52b274]/5 hover:bg-[#52b274]/8' : 'hover:bg-muted/20'
                        )}
                      >
                        <td className="px-5 py-3.5 max-w-[200px]">
                          <div className="flex items-start gap-2">
                            {isAssigned && <Star className="size-3.5 text-[#52b274] mt-0.5 shrink-0 fill-[#52b274]" />}
                            <div>
                              <p className="text-sm font-semibold line-clamp-2 leading-snug">{post.title}</p>
                              {isAssigned && (
                                <span className="text-[10px] font-bold text-[#52b274] mt-0.5 block">Slot #{post.featuredSlot}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 max-w-[240px]">
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                            {(post.text || '').slice(0, 100) || '—'}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Select
                            value={currentSlot}
                            onValueChange={(value) =>
                              setSelection((s) => ({ ...s, [post._id]: value }))
                            }
                          >
                            <SelectTrigger className="w-[120px] mx-auto h-8 text-sm">
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                                <SelectItem
                                  key={n}
                                  value={String(n)}
                                  disabled={!!(usedSlots[n] && usedSlots[n] !== post._id)}
                                >
                                  Slot {n} {usedSlots[n] && usedSlots[n] !== post._id ? '(taken)' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleSave(post._id)}
                            disabled={saving}
                            className="bg-[#52b274] hover:bg-[#3d9659] text-white"
                          >
                            {saving && <Loader2 className="mr-1 size-3 animate-spin" />}
                            {isAssigned ? 'Update' : 'Assign'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border/40">
              {filteredPosts.map((post) => {
                const isAssigned = Boolean(post.featuredSlot)
                const currentSlot = selection[post._id] ?? (post.featuredSlot ? String(post.featuredSlot) : '')
                return (
                  <div
                    key={post._id}
                    className={cn('p-4 space-y-3', isAssigned && 'bg-[#52b274]/5')}
                  >
                    <div>
                      <div className="flex items-start gap-2">
                        {isAssigned && <Star className="size-3.5 text-[#52b274] mt-0.5 shrink-0 fill-[#52b274]" />}
                        <p className="text-sm font-semibold line-clamp-2">{post.title}</p>
                      </div>
                      {isAssigned && (
                        <p className="text-[11px] font-bold text-[#52b274] mt-1">Featured in Slot #{post.featuredSlot}</p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {(post.text || '').slice(0, 120) || '—'}
                    </p>
                    <div className="flex items-center gap-2">
                      <Select
                        value={currentSlot}
                        onValueChange={(value) =>
                          setSelection((s) => ({ ...s, [post._id]: value }))
                        }
                      >
                        <SelectTrigger className="flex-1 h-8 text-sm">
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
                        className="bg-[#52b274] hover:bg-[#3d9659] text-white"
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
      </div>
    </div>
  )
}
