'use client';

import { useState } from 'react';
import type { NoFollowersProps } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { SubmitPost, SUBMIT_POST_DIALOG_CLASS } from '@/components/SubmitPost';

export function NoFollowers({ filter }: NoFollowersProps) {
  const isFollowing = filter === 'following';
  const [submitOpen, setSubmitOpen] = useState(false);

  return (
    <Card id="component-followers-display">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto">
          <div id="component-empty-follow-verbiage" className="text-center">
            <p className="text-muted-foreground">
              {isFollowing
                ? 'Here you are going to see people that you like their ideas. You could search for new people to follow or find some friends.'
                : 'Here you are going to see people that like your ideas. Start writing to attract people to follow you.'}
            </p>
          </div>
          <div
            id="component-empty-follow-actions"
            className="flex gap-4 flex-wrap justify-center"
          >
            {isFollowing ? (
              // Find Friends / Go to Search are intentionally hidden for now.
              // <>
              //   <Button variant="secondary" asChild>
              //     <Link href="/search">Find Friends</Link>
              //   </Button>
              //   <Button variant="default" asChild>
              //     <Link href="/search">Go to Search</Link>
              //   </Button>
              // </>
              null
            ) : (
              <Button variant="default" onClick={() => setSubmitOpen(true)}>
                Create a Post
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Create Quote dialog — same flow as the navbar's create button */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className={SUBMIT_POST_DIALOG_CLASS} showCloseButton={false}>
          <DialogTitle className="sr-only">Create Quotes</DialogTitle>
          <SubmitPost setOpen={setSubmitOpen} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
