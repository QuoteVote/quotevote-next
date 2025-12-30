'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCarousel } from '@/hooks/useCarousel'
import { cn } from '@/lib/utils'
import type { CarouselProps } from '@/types/carousel'

export function Carousel({
  children,
  navButtonsAlwaysVisible = true,
  autoplay = true,
  activeStepProp = 0,
  setActiveStepProp,
  activeIndicatorProps,
  indicatorProps,
  index,
  onChange,
  pauseOnHover = true,
  autoplayInterval = 3000,
  enableSwipe = true,
  rtl = false,
}: CarouselProps) {
  const childrenArray = Array.isArray(children) ? children : [children]
  const maxSteps = childrenArray.length
  const containerRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isHovering, setIsHovering] = useState(false)

  const {
    activeStep,
    handleNext,
    handleBack,
    goToStep,
    canGoNext,
    canGoBack,
    pause,
    resume,
  } = useCarousel({
    initialStep: activeStepProp,
    maxSteps,
    controlledIndex: index,
    onStepChange: (step) => {
      setActiveStepProp?.(step)
      onChange?.(step)
    },
    autoplay: autoplay && !isHovering,
    autoplayInterval,
  })

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && !rtl) {
        e.preventDefault()
        handleBack()
      } else if (e.key === 'ArrowRight' && !rtl) {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft' && rtl) {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowRight' && rtl) {
        e.preventDefault()
        handleBack()
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('keydown', handleKeyDown)
      container.setAttribute('tabIndex', '0')
    }

    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [handleNext, handleBack, rtl])

  // Touch/swipe handlers
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipe) return
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!enableSwipe) return
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!enableSwipe || touchStart === null || touchEnd === null) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && canGoNext) {
      handleNext()
    }
    if (isRightSwipe && canGoBack) {
      handleBack()
    }
  }

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsHovering(true)
      pause()
    }
  }

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsHovering(false)
      resume()
    }
  }

  const navButtonsVisibility = navButtonsAlwaysVisible ? 'visible' : 'hidden'

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-full overflow-hidden flex-grow flex flex-col items-center justify-center"
      role="region"
      aria-label="Carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleBack}
        disabled={!canGoBack}
        className={cn(
          'absolute left-2.5 top-1/2 -translate-y-1/2 z-10 bg-transparent hover:bg-white/10',
          'hidden sm:flex',
          navButtonsVisibility === 'hidden' && 'hidden'
        )}
        aria-label="Previous slide"
      >
        {rtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        disabled={!canGoNext}
        className={cn(
          'absolute right-2.5 top-1/2 -translate-y-1/2 z-10 bg-transparent hover:bg-white/10',
          'hidden sm:flex',
          navButtonsVisibility === 'hidden' && 'hidden'
        )}
        aria-label="Next slide"
      >
        {rtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* Carousel Content */}
      <div className="relative w-full h-full overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${activeStep * 100}%)`,
            width: `${maxSteps * 100}%`,
          }}
        >
          {childrenArray.map((child, index) => {
            const isHidden = index !== activeStep
            return (
              <div
                key={index}
                className="w-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                style={{ width: `${100 / maxSteps}%` }}
                {...(isHidden ? { 'aria-hidden': 'true' } : {})}
              >
                {child}
              </div>
            )
          })}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
        {Array.from({ length: maxSteps }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goToStep(index)}
            className={cn(
              'h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
              index === activeStep
                ? cn('w-6 bg-primary', activeIndicatorProps?.className)
                : cn('w-2 bg-gray-400 hover:bg-gray-500', indicatorProps?.className)
            )}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === activeStep ? 'true' : 'false'}
          />
        ))}
      </div>
    </div>
  )
}

