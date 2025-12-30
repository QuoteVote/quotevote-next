'use client'

import { AuthModalProvider } from '@/context/AuthModalContext'
import PostChatMessage from '@/components/PostChat/PostChatMessage'
import PostChatSend from '@/components/PostChat/PostChatSend'

// Mock data for testing the UI
const mockMessage = {
  _id: 'test-msg-1',
  userId: 'other-user-123',
  text: 'This is a test message from another user. It can be quite long to test how the bubble handles wrapping and such.',
  created: new Date().toISOString(),
  user: {
    name: 'Test User',
    username: 'testuser',
    avatar: undefined,
  },
}

const mockOwnMessage = {
  _id: 'test-msg-2',
  userId: '', // Will be replaced with current user ID
  text: 'This is my own message!',
  created: new Date(Date.now() - 60000).toISOString(),
  user: {
    name: 'Me',
    username: 'me',
    avatar: undefined,
  },
}

export default function TestPostChatPage() {
  return (
    <AuthModalProvider>
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="mb-6 text-2xl font-bold">PostChat Component Test</h1>
      
      <div className="mx-auto max-w-2xl rounded-lg bg-gray-200 p-4">
        <h2 className="mb-4 text-lg font-semibold">Messages</h2>
        
        {/* Test messages */}
        <div className="space-y-2">
          <PostChatMessage message={mockMessage} />
          <PostChatMessage message={mockOwnMessage} />
          <PostChatMessage message={{...mockMessage, _id: 'test-3', text: 'Short msg'}} />
        </div>

        {/* Send input */}
        <div className="mt-4 rounded bg-white">
          <PostChatSend 
            messageRoomId="test-room-123"
            title="Test Post"
            postId="test-post-123"
          />
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Note: Mutations won&apos;t work without the backend running. This is for visual testing only.
      </p>
    </div>
    </AuthModalProvider>
  )
}
