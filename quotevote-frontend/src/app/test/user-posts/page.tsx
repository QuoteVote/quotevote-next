'use client'

import { useState } from 'react'
import { UserPosts } from '@/components/UserPosts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

/**
 * Test page for UserPosts component
 * 
 * This page allows testing the UserPosts component with different user IDs.
 * Navigate to /test/user-posts to test the component.
 */
export default function UserPostsTestPage() {
  const [userId, setUserId] = useState<string>('')
  const [testUserId, setTestUserId] = useState<string>('')

  const handleTest = () => {
    if (userId.trim()) {
      setTestUserId(userId.trim())
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>UserPosts Component Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userId">User ID</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="userId"
                  type="text"
                  placeholder="Enter user ID to test"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTest()
                    }
                  }}
                />
                <Button onClick={handleTest} disabled={!userId.trim()}>
                  Load Posts
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Enter a user ID to fetch and display their posts. The component
                will show pagination, loading states, empty states, and error
                handling.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {testUserId && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Posts for User: {testUserId}</CardTitle>
            </CardHeader>
            <CardContent>
              <UserPosts userId={testUserId} />
            </CardContent>
          </Card>
        </div>
      )}

      {!testUserId && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Enter a user ID above to test the UserPosts component.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

