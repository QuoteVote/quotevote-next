'use client'

import Image from 'next/image'
import { useResponsive } from '@/hooks/useResponsive'
import { DoubleArrowIconButton } from '@/components/CustomButtons'
import { RequestInviteCarouselButton } from '../RequestInviteCarouselButton'
import type { CarouselContentProps } from '@/types/carousel'

export function PersonalCarouselThirdContent({ classes, setContentIndex }: CarouselContentProps) {
  const { width, isMobile } = useResponsive()
  const imageWidth = isMobile ? 200 : width === 'md' ? '365.43px' : '400.43px'

  return (
    <div className="flex flex-row justify-center items-center pl-[60px] pr-[60px] md:pr-[60px] pr-0">
      <div className="w-full md:w-7/12">
        <Image
          alt="Personal 3"
          src="/assets/PersonalContent3.png"
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
            <strong> Join a growing community of more than 11047 people</strong> in honest and
            informed conversations. Quote is yours to shape.
          </p>
          <br />
          <p>
            <strong> Share your opinions with friends and/or strangers.</strong> Work on projects
            with your teams. Vote transparently.
          </p>
          <br />
        </div>

        <p className={classes?.bottomText || 'text-base'}>
          {' '}
          What else do <span className={classes?.greenText || 'text-[#52b274]'}> we have </span>
          for you?
          <DoubleArrowIconButton onClick={() => setContentIndex?.(3)} />
        </p>
      </div>
      <RequestInviteCarouselButton classes={classes} />
    </div>
  )
}

