'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Loader2, AlertCircle, FileText, CheckCircle2, XCircle, User } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { GET_TOP_POSTS } from '@/graphql/queries'
import { APPROVE_POST, REJECT_POST } from '@/graphql/mutations'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'
import { useAppStore } from '@/store/useAppStore'
import type { SettingsUserData } from '@/types/settings'

interface PostEntity {
  _id: string
  title: string
  text?: string
  created: string
  approvedBy?: string[]
  rejectedBy?: string[]
  creator?: { _id: string; name?: string; username?: string }
}

export default function PostModerationTab() {
  const userData = useAppStore((s) => s.user.data) as SettingsUserData | undefined
  const userId = userData?.id ?? userData?._id ?? ''

  const { data, loading, error, refetch } = useQuery<{ posts: { entities: PostEntity[] } }>(
    GET_TOP_POSTS,
    {
      variables: { limit: 50, offset: 0, searchKey: '', startDateRange: null, endDateRange: null, friendsOnly: false, interactions: false },
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    }
  )

  const [approvePost, { loading: approving }] = useMutation(APPROVE_POST)
  const [rejectPost, { loading: rejecting }] = useMutation(REJECT_POST)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null)

  const handleApprove = async (postId: string) => {
    try {
      await approvePost({ variables: { postId, userId, remove: false } })
      toast.success('Post approved')
      refetch()
    } catch (err) {
      toast.error(replaceGqlError(err instanceof Error ? err.message : 'Failed to approve post'))
    }
  }

  const handleReject = async (postId: string) => {
    try {
      await rejectPost({ variables: { postId, userId, remove: false } })
      toast.success('Post rejected')
      setRejectingPostId(null)
      setRejectReason('')
      refetch()
    } catch (err) {
      toast.error(replaceGqlError(err instanceof Error ? err.message : 'Failed to reject post'))
    }
  }

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
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  const posts: PostEntity[] = data.posts?.entities || []
  const pendingPosts = posts.filter((p) => !p.approvedBy || p.approvedBy.length === 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tabular-nums">{pendingPosts.length}</span>
            <span className="text-sm font-medium text-muted-foreground">posts pending review</span>
          </div>
        </div>
        {pendingPosts.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/10 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-full">
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            Needs review
          </div>
        )}
      </div>

      {pendingPosts.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card flex flex-col items-center justify-center py-16 gap-3">
          <div className="size-14 rounded-2xl bg-[#52b274]/10 flex items-center justify-center">
            <CheckCircle2 className="size-7 text-[#52b274]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">No posts pending moderation</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Post</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Author</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {pendingPosts.map((post) => (
                  <tr key={post._id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4 max-w-[200px]">
                      <div className="flex items-start gap-2">
                        <FileText className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="text-sm font-semibold line-clamp-2 leading-snug">{post.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <User className="size-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">@{post.creator?.username || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-[240px]">
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                        {(post.text || '').slice(0, 120) || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(post._id)}
                          disabled={approving}
                          className="bg-[#52b274] hover:bg-[#3d9659] text-white gap-1"
                        >
                          {approving ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                          Approve
                        </Button>
                        <Popover
                          open={rejectingPostId === post._id}
                          onOpenChange={(open) => {
                            setRejectingPostId(open ? post._id : null)
                            if (!open) setRejectReason('')
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" disabled={rejecting} className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950 gap-1">
                              <XCircle className="size-3" />
                              Reject
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 space-y-3" align="end">
                            <div>
                              <p className="text-sm font-semibold">Reject post</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Optionally provide a reason</p>
                            </div>
                            <Textarea
                              placeholder="Reason for rejection..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              rows={3}
                              className="text-sm"
                            />
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => { setRejectingPostId(null); setRejectReason('') }}>
                                Cancel
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleReject(post._id)} disabled={rejecting}>
                                {rejecting && <Loader2 className="mr-1 size-3 animate-spin" />}
                                Confirm Rejection
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border/40">
            {pendingPosts.map((post) => (
              <div key={post._id} className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold line-clamp-2">{post.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">@{post.creator?.username || 'Unknown'}</p>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {(post.text || '').slice(0, 140) || '—'}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-[#52b274] hover:bg-[#3d9659] text-white" onClick={() => handleApprove(post._id)} disabled={approving}>
                    Approve
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleReject(post._id)} disabled={rejecting}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
