'use client'

import { useState } from 'react'
import { Carousel } from '../Carousel'
import { PersonalCarouselFirstContent } from './PersonalCarouselFirstContent'
import { PersonalCarouselSecondContent } from './PersonalCarouselSecondContent'
import { PersonalCarouselThirdContent } from './PersonalCarouselThirdContent'
import { PersonalCarouselFourthContent } from './PersonalCarouselFourthContent'
import type { PlanCarouselProps } from '@/types/carousel'

export function PersonalPlanCarousel({ classes, setCarouselCurrentIndex }: PlanCarouselProps) {
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
      <PersonalCarouselFirstContent classes={classes} />
      <PersonalCarouselSecondContent classes={classes} />
      <PersonalCarouselThirdContent classes={classes} setContentIndex={setContentIndex} />
      <PersonalCarouselFourthContent classes={classes} />
    </Carousel>
  )
}

