'use client'

import Image from 'next/image'
import { useResponsive } from '@/hooks/useResponsive'
import { RequestInviteCarouselButton } from '../RequestInviteCarouselButton'
import type { CarouselContentProps } from '@/types/carousel'

export function PersonalCarouselFirstContent({ classes }: CarouselContentProps) {
  const { width, isMobile } = useResponsive()

  return (
    <div className="flex flex-row justify-end items-baseline pl-10 pr-2.5">
      <div className="w-full md:w-1/2">
        <div className="flex flex-row justify-start items-end">
          <div className="w-1/4">
            <Image
              alt="Personal"
              src="/assets/AvatarGirl.png"
              width={isMobile ? 50 : 90}
              height={isMobile ? 50 : 350}
              className="object-contain"
              style={{
                width: isMobile ? '50px' : '90%',
                height: isMobile ? 'auto' : '350.51px',
              }}
            />
          </div>
          <div className="w-3/4">
            <Image
              alt="Personal"
              src="/assets/PostPage.svg"
              width={isMobile ? 200 : 400}
              height={isMobile ? 200 : 350}
              className="object-contain"
              style={{
                height: isMobile ? 'auto' : '350.51px',
                width: isMobile ? '200px' : '100%',
              }}
            />
          </div>
        </div>
      </div>
      <div className="w-full md:w-1/2">
        <Image
          alt="Personal"
          src="/assets/PersonalContent1b.svg"
          width={isMobile ? 200 : 400}
          height={isMobile ? 200 : 400}
          className="object-cover"
          style={{
            width: isMobile ? '200px' : '100%',
            marginLeft: width === 'xs' ? '20px' : '10px',
          }}
        />
      </div>
      <RequestInviteCarouselButton classes={classes} />
    </div>
  )
}

