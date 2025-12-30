'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { CarouselContentProps } from '@/types/carousel'

export function RequestInviteCarouselButton({ classes }: CarouselContentProps) {
  const router = useRouter()

  return (
    <div className="md:hidden w-full">
      <div className="w-full px-4">
        <Button
          variant="default"
          className={classes?.requestInvite || 'w-full'}
          type="button"
          onClick={() => router.push('/auth/request-access')}
        >
          Request Invite
        </Button>
      </div>
    </div>
  )
}

