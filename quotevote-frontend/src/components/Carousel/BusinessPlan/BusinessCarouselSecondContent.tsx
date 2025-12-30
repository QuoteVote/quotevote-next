'use client'

import Image from 'next/image'
import { useResponsive } from '@/hooks/useResponsive'
import { RequestInviteCarouselButton } from '../RequestInviteCarouselButton'
import type { CarouselContentProps } from '@/types/carousel'

export function BusinessCarouselSecondContent({ classes }: CarouselContentProps) {
  const { width, isMobile } = useResponsive()
  const browserWidth = width === 'xs' ? '400px' : '80%'
  const imageWidth = isMobile ? 200 : browserWidth
  const padding = width === 'xs' ? 20 : 60

  return (
    <div
      className="flex flex-row justify-center items-center"
      style={{ paddingLeft: padding, paddingRight: padding }}
    >
      <div className="w-full sm:w-full md:w-2/3 lg:w-7/12">
        <Image
          alt="Business 2"
          src="/assets/BusinessContent2.svg"
          width={typeof imageWidth === 'string' ? parseInt(imageWidth) : imageWidth}
          height={isMobile ? 200 : 350}
          className="object-contain"
          style={{
            width: imageWidth,
            height: isMobile ? 'auto' : '350.51px',
          }}
        />
      </div>
      <div className="w-full sm:w-full md:w-1/3 lg:w-5/12">
        <div className={classes?.opinionsText || 'text-base'}>
          <p style={{ marginTop: width === 'xs' ? 0 : 20 }}>
            <strong>Promote democracy and transparency</strong> within your team. Quote makes it so
            the whole team can see progress in real time.
          </p>
          <br />
        </div>
      </div>
      <div className="w-full sm:w-full flex justify-center items-center">
        <RequestInviteCarouselButton classes={classes} />
      </div>
    </div>
  )
}

