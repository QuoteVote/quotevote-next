'use client'

import Image from 'next/image'
import { useResponsive } from '@/hooks/useResponsive'
import { RequestInviteCarouselButton } from '../RequestInviteCarouselButton'
import type { CarouselContentProps } from '@/types/carousel'

export function PersonalCarouselSecondContent({ classes }: CarouselContentProps) {
  const { width, isMobile } = useResponsive()
  const imageWidth = isMobile ? 200 : width === 'xs' || width === 'sm' ? '400.43px' : '435.43px'

  return (
    <div className="flex flex-row justify-center items-center pl-[60px] pr-[60px] md:pr-[60px] pr-0">
      <div className="w-full md:w-2/3">
        <Image
          alt="Personal"
          src="/assets/PersonalContent2.svg"
          width={typeof imageWidth === 'string' ? parseInt(imageWidth) : imageWidth}
          height={isMobile ? 200 : 350}
          className="object-contain"
          style={{
            width: imageWidth,
            height: isMobile ? 'auto' : '350.51px',
          }}
        />
      </div>
      <div className="w-full md:w-1/3">
        <div>
          <p className="text-base font-medium">Comments</p>
          <p className="text-xs text-muted-foreground">When you comment it will appear here.</p>
        </div>
      </div>
      <RequestInviteCarouselButton classes={classes} />
    </div>
  )
}

