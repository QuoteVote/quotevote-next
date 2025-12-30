'use client'

import Image from 'next/image'
import { useResponsive } from '@/hooks/useResponsive'
import { RequestInviteCarouselButton } from '../RequestInviteCarouselButton'
import type { CarouselContentProps } from '@/types/carousel'

export function PersonalCarouselFourthContent({ classes }: CarouselContentProps) {
  const { width, isMobile } = useResponsive()
  const imageWidth = isMobile ? 200 : width === 'md' ? '365.43px' : '400.43px'

  return (
    <div className="flex flex-row justify-center items-center pl-[60px] pr-[60px] md:pr-[60px] pr-0">
      <div className="w-full md:w-7/12">
        <Image
          alt="Personal 4"
          src="/assets/PersonalContent4.svg"
          width={typeof imageWidth === 'string' ? parseInt(imageWidth) : imageWidth}
          height={isMobile ? 200 : 350}
          className="object-contain"
          style={{
            width: imageWidth,
            height: isMobile ? 'auto' : '350.51px',
          }}
        />
      </div>
      <div className="w-full md:w-5/12">
        <div className={classes?.opinionsText || 'text-base'}>
          <p>
            <strong>See posts with the most activity.</strong> Filter by keyword, date range, or
            follows. See what people are talking about and sharing the most.
          </p>
          <br />
          <p>
            <strong>No content is boosted by paid promotion or advertising.</strong>
          </p>
          <br />
        </div>
      </div>
      <RequestInviteCarouselButton classes={classes} />
    </div>
  )
}

