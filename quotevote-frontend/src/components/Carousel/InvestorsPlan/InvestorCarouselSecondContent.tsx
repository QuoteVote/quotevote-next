'use client'

import Image from 'next/image'
import { useResponsive } from '@/hooks/useResponsive'
import { InvestButton, DoubleArrowIconButton } from '@/components/CustomButtons'
import { MOBILE_IMAGE_WIDTH } from './InvestorPlanCarousel'
import type { CarouselContentProps } from '@/types/carousel'

export function InvestorCarouselSecondContent({ classes, setContentIndex }: CarouselContentProps) {
  const { width, isMobile } = useResponsive()
  const { opinionsText, bottomText, greenText } = classes || {}
  const browserWidth = '435.43px'
  const imageWidth = isMobile ? MOBILE_IMAGE_WIDTH : browserWidth

  return (
    <div
      className="flex flex-row justify-center items-center"
      style={{
        paddingLeft: width === 'xs' ? 20 : 60,
        paddingRight: width === 'xs' ? 0 : 60,
      }}
    >
      <div className="w-full sm:w-full md:w-7/12 lg:w-1/2">
        <Image
          alt="Investor 2"
          src="/assets/InvestorContent2.svg"
          width={typeof imageWidth === 'string' ? parseInt(imageWidth) : imageWidth}
          height={isMobile ? 200 : 350}
          className="object-contain"
          style={{
            width: imageWidth,
            height: isMobile ? 'auto' : '350.51px',
          }}
        />
      </div>
      <div className="w-full sm:w-full md:w-5/12 lg:w-1/2">
        <div className={opinionsText || 'text-base'}>
          By capping individual investments at $2000,{' '}
          <strong>we ensure shareholders have an equal voice, and provide a more inclusive opportunity to invest. </strong>
          <br />
          <br />
          We keep growth organized and open through Quote Vote and{' '}
          <strong>all shareholder opinions hold the same weight. </strong>
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
          </span>{'  '}
          I want to <span className={greenText || 'text-[#52b274]'}> to know details</span>
          <DoubleArrowIconButton onClick={() => setContentIndex?.(2)} />
        </p>
      </div>
    </div>
  )
}

