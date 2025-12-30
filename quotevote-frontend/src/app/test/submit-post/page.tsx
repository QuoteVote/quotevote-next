'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SubmitPost } from '@/components/SubmitPost'

export default function SubmitPostTestPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">SubmitPost Component Test</h1>
          <p className="text-muted-foreground">
            Test the SubmitPost component with form validation and post creation.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Click the &quot;Open Submit Post&quot; button to open the form</li>
            <li>Try submitting with empty fields to see validation errors</li>
            <li>Fill in a title and text content</li>
            <li>Select or create a group</li>
            <li>Submit the form and verify the post is created</li>
            <li>Check that validation messages appear and disappear correctly</li>
            <li>Verify GraphQL mutation results</li>
          </ol>
        </div>

        <div className="space-y-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Open Submit Post</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-0">
              <SubmitPost setOpen={setOpen} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h3 className="text-xl font-semibold">Component Features</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Form validation using Zod schema</li>
            <li>Group selection with create option</li>
            <li>URL parsing and content extraction</li>
            <li>GraphQL mutations for post and group creation</li>
            <li>Success/error alerts with shareable links</li>
            <li>Responsive design for mobile and desktop</li>
            <li>Loading states during submission</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

