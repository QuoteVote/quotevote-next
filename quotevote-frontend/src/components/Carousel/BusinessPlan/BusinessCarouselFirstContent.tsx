'use client'

import Image from 'next/image'
import { useResponsive } from '@/hooks/useResponsive'
import { RequestInviteCarouselButton } from '../RequestInviteCarouselButton'
import { MOBILE_IMAGE_WIDTH } from './BusinessPlanCarousel'
import type { CarouselContentProps } from '@/types/carousel'

export function BusinessCarouselFirstContent({ classes }: CarouselContentProps) {
  const { width, isMobile } = useResponsive()
  const browserWidth = width === 'xs' ? '400px' : '80%'
  const imageWidth = isMobile ? MOBILE_IMAGE_WIDTH : browserWidth
  const padding = width === 'xs' ? 20 : 60

  return (
    <div
      className="flex flex-row justify-center items-center"
      style={{ paddingLeft: padding, paddingRight: padding }}
    >
      <div className="w-full sm:w-full md:w-2/3 lg:w-7/12">
        <Image
          alt="Business"
          src="/assets/BusinessContent1.svg"
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
          <p>
            <strong>Talk to your team</strong>, poll the entire company, assess their feedback, plan
            the next big company initiative that will knock it out of the park.
          </p>
          <br />
        </div>
      </div>
      <RequestInviteCarouselButton classes={classes} />
    </div>
  )
}

