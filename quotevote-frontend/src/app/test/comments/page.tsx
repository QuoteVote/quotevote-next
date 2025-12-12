"use client"

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Comment, CommentList, CommentReactions, CommentInput } from '@/components/Comment'
import { CommentData } from '@/types/comment'
import { Separator } from '@/components/ui/separator'
import { AuthModalProvider } from '@/context/AuthModalContext'

// Mock Data
const mockUser = {
  _id: 'user1',
  username: 'jdoe',
  name: 'John Doe',
  avatar: 'https://github.com/shadcn.png',
}

const mockComments: CommentData[] = [
  {
    _id: 'c1',
    userId: 'user1',
    content: 'This is a test comment using shadcn/ui and Tailwind.',
    created: new Date().toISOString(),
    user: mockUser,
  },
  {
    _id: 'c2',
    userId: 'user2',
    content: 'Another comment to test the list functionality.',
    created: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    user: {
      ...mockUser,
      _id: 'user2',
      username: 'alice',
      avatar: 'A', // Fallback test
    },
  },
]

const mockReactions = [
  { _id: 'r1', userId: 'user1', actionId: 'action1', emoji: '👍' },
  { _id: 'r2', userId: 'user2', actionId: 'action1', emoji: '❤️' },
  { _id: 'r3', userId: 'user3', actionId: 'action1', emoji: '👍' },
]

export default function TestCommentsPage() {
  const [comments] = useState(mockComments)
  const setUserData = useAppStore((state) => state.setUserData)

  // Mock a logged-in user for this test page
  useEffect(() => {
    setUserData({
      _id: mockUser._id,
      id: mockUser._id,
      username: mockUser.username,
      name: mockUser.name,
      avatar: mockUser.avatar,
      admin: true
    })
  }, [setUserData])
  
  return (
    <AuthModalProvider>
    <div className="container mx-auto max-w-2xl py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">Comment Components Migration Test</h1>
        <p className="text-muted-foreground mb-4">
          Visual verification for Comment, CommentList, and CommentReactions components.
        </p>
      </div>

      <Separator />

      <section>
        <h2 className="text-xl font-semibold mb-4">Single Comment</h2>
        <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
          <Comment comment={mockComments[0]} />
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-xl font-semibold mb-4">Comment List</h2>
        <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
          <CommentList comments={comments} />
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-xl font-semibold mb-4">Reactions</h2>
        <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <span>React to this:</span>
          <CommentReactions actionId="action1" reactions={mockReactions} />
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-xl font-semibold mb-4">Create Comment</h2>
        <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
          <CommentInput actionId="test-post-1" />
        </div>
      </section>
    </div>
    </AuthModalProvider>
  )
}
