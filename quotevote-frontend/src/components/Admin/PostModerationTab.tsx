'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  creator?: {
    _id: string
    name?: string
    username?: string
  }
}

export default function PostModerationTab() {
  const userData = useAppStore((s) => s.user.data) as SettingsUserData | undefined
  const userId = userData?.id ?? userData?._id ?? ''

  const { data, loading, error, refetch } = useQuery<{
    posts: { entities: PostEntity[] }
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

  const [approvePost, { loading: approving }] = useMutation(APPROVE_POST)
  const [rejectPost, { loading: rejecting }] = useMutation(REJECT_POST)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null)

  const handleApprove = async (postId: string) => {
    try {
      await approvePost({
        variables: { postId, userId, remove: false },
      })
      toast.success('Post approved')
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve post'
      toast.error(replaceGqlError(message))
    }
  }

  const handleReject = async (postId: string) => {
    try {
      await rejectPost({
        variables: { postId, userId, remove: false },
      })
      toast.success('Post rejected')
      setRejectingPostId(null)
      setRejectReason('')
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject post'
      toast.error(replaceGqlError(message))
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post Moderation</CardTitle>
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
          <CardTitle className="text-base">Post Moderation</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const posts: PostEntity[] = data.posts?.entities || []
  // Show posts that haven't been approved yet
  const pendingPosts = posts.filter(
    (p) => !p.approvedBy || p.approvedBy.length === 0
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Post Moderation ({pendingPosts.length} pending)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-medium">No posts pending moderation</p>
            <p className="text-sm text-muted-foreground mt-1">
              All posts have been reviewed
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
                    <TableHead>Author</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPosts.map((post) => (
                    <TableRow key={post._id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {post.title}
                      </TableCell>
                      <TableCell className="text-sm">
                        {post.creator?.username || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {(post.text || '').slice(0, 100) || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(post._id)}
                            disabled={approving}
                          >
                            {approving && <Loader2 className="mr-1 size-3 animate-spin" />}
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
                              <Button variant="destructive" size="sm" disabled={rejecting}>
                                Reject
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 space-y-3">
                              <p className="text-sm font-medium">Rejection reason</p>
                              <Textarea
                                placeholder="Enter reason for rejection..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={3}
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setRejectingPostId(null)
                                    setRejectReason('')
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleReject(post._id)}
                                  disabled={rejecting}
                                >
                                  {rejecting && <Loader2 className="mr-1 size-3 animate-spin" />}
                                  Confirm
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {pendingPosts.map((post) => (
                <div key={post._id} className="rounded-lg border p-4 space-y-3">
                  <p className="font-medium text-sm line-clamp-2">{post.title}</p>
                  <p className="text-xs text-muted-foreground">
                    by {post.creator?.username || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {(post.text || '').slice(0, 140) || '—'}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleApprove(post._id)}
                      disabled={approving}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleReject(post._id)}
                      disabled={rejecting}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
