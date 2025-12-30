'use client'

import Image from 'next/image'
import { useResponsive } from '@/hooks/useResponsive'
import { InvestButton, DoubleArrowIconButton } from '@/components/CustomButtons'
import { MOBILE_IMAGE_WIDTH } from './InvestorPlanCarousel'
import type { CarouselContentProps } from '@/types/carousel'

export function InvestorCarouselFirstContent({ classes, setContentIndex }: CarouselContentProps) {
  const { width, isMobile } = useResponsive()
  const { opinionsText, bottomText, greenText } = classes || {}
  const browserWidth = '400.43px'
  const imageWidth = isMobile ? MOBILE_IMAGE_WIDTH : browserWidth

  return (
    <div
      className="flex flex-row justify-center items-center"
      style={{
        paddingLeft: width === 'xs' ? 20 : 60,
        paddingRight: width === 'xs' ? 0 : 60,
      }}
    >
      <div className="w-full sm:w-full md:w-1/2">
        <Image
          alt="Investor"
          src="/assets/InvestorContent1.png"
          width={typeof imageWidth === 'string' ? parseInt(imageWidth) : imageWidth}
          height={isMobile ? 200 : 350}
          className="object-contain"
          style={{
            width: imageWidth,
            height: isMobile ? 'auto' : '350.51px',
          }}
        />
      </div>
      <div className="w-full sm:w-full md:w-1/2">
        <div className={opinionsText || 'text-base'}>
          We created Quote Vote with promoting <strong>democracy and community as our pillar.</strong>
          <br />
          <br />
          This is why we reject investment from VC firms, and encourage users to invest and become a
          part of the change. <strong>Invest up to $2000 to grow with us. </strong>
          <br />
          <br />
        </div>
        <div className="md:hidden">
          <InvestButton
            width={width}
            handleClick={() => {
              setContentIndex?.(2)
            }}
          />
        </div>
        <p className={bottomText || 'text-base'}>
          <span className="hidden md:inline">
            <InvestButton
              width={width}
              handleClick={() => {
                setContentIndex?.(2)
              }}
            />
          </span>{' '}
          What is <span className={greenText || 'text-[#52b274]'}> the deal </span>
          <DoubleArrowIconButton onClick={() => setContentIndex?.(1)} />
        </p>
      </div>
    </div>
  )
}

