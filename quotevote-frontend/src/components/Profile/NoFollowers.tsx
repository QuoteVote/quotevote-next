'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { NoFollowersProps } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function NoFollowers({ filter }: NoFollowersProps) {
  const isFollowing = filter === 'following';

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
          <div id="component-empty-follow-image" className="relative w-64 h-64">
            <Image
              alt={isFollowing ? 'EmptyFollowing' : 'EmptyFollowers'}
              src={
                isFollowing
                  ? '/assets/EmptyFollowing.png'
                  : '/assets/EmptyFollowers.png'
              }
              fill
              className="object-contain"
            />
          </div>
          <div
            id="component-empty-follow-actions"
            className="flex gap-4 flex-wrap justify-center"
          >
            {isFollowing ? (
              <>
                <Button variant="secondary" asChild>
                  <Link href="/search">Find Friends</Link>
                </Button>
                <Button variant="default" asChild>
                  <Link href="/search">Go to Search</Link>
                </Button>
              </>
            ) : (
              <Button variant="secondary" asChild>
                <Link href="/submit">Create a Post</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

