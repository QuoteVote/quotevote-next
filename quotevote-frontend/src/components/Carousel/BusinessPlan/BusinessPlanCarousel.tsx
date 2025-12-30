'use client'

import { useState } from 'react'
import { Carousel } from '../Carousel'
import { BusinessCarouselFirstContent } from './BusinessCarouselFirstContent'
import { BusinessCarouselSecondContent } from './BusinessCarouselSecondContent'
import { BusinessCarouselThirdContent } from './BusinessCarouselThirdContent'
import type { PlanCarouselProps } from '@/types/carousel'

export const MOBILE_IMAGE_WIDTH = 250

export function BusinessPlanCarousel({ classes, setCarouselCurrentIndex }: PlanCarouselProps) {
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
      <BusinessCarouselFirstContent classes={classes} setContentIndex={setContentIndex} />
      <BusinessCarouselSecondContent classes={classes} setContentIndex={setContentIndex} />
      <BusinessCarouselThirdContent classes={classes} setContentIndex={setContentIndex} />
    </Carousel>
  )
}

