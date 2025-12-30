'use client'

import { useState } from 'react'
import { Carousel } from '../Carousel'
import { InvestorCarouselFirstContent } from './InvestorCarouselFirstContent'
import { InvestorCarouselSecondContent } from './InvestorCarouselSecondContent'
import { InvestorCarouselThirdContent } from './InvestorCarouselThirdContent'
import type { PlanCarouselProps } from '@/types/carousel'

export const MOBILE_IMAGE_WIDTH = 250

export function InvestorPlanCarousel({ classes, setCarouselCurrentIndex }: PlanCarouselProps) {
  const [contentIndex, setContentIndex] = useState(0)

  return (
    <Carousel
      navButtonsAlwaysVisible
      index={contentIndex}
      onChange={(index) => {
        setCarouselCurrentIndex?.(index)
      }}
      activeIndicatorProps={{
        className: classes?.activeIndicator,
      }}
      indicatorProps={{
        className: classes?.inactiveIndicator,
      }}
    >
      <InvestorCarouselFirstContent classes={classes} setContentIndex={setContentIndex} />
      <InvestorCarouselSecondContent classes={classes} setContentIndex={setContentIndex} />
      <InvestorCarouselThirdContent classes={classes} />
    </Carousel>
  )
}

