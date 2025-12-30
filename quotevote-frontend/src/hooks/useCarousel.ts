'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { UseCarouselOptions, UseCarouselReturn } from '@/types/carousel'

export function useCarousel({
  initialStep = 0,
  maxSteps,
  controlledIndex,
  onStepChange,
  autoplay = false,
  autoplayInterval = 3000,
}: UseCarouselOptions): UseCarouselReturn {
  const [activeStep, setActiveStep] = useState(initialStep)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Use controlled index if provided, otherwise use internal state
  const currentStep = controlledIndex !== undefined ? controlledIndex : activeStep

  const goToStep = useCallback(
    (step: number) => {
      const newStep = Math.max(0, Math.min(step, maxSteps - 1))
      if (controlledIndex === undefined) {
        setActiveStep(newStep)
      }
      onStepChange?.(newStep)
    },
    [maxSteps, controlledIndex, onStepChange]
  )

  const handleNext = useCallback(() => {
    goToStep(currentStep + 1)
  }, [currentStep, goToStep])

  const handleBack = useCallback(() => {
    goToStep(currentStep - 1)
  }, [currentStep, goToStep])

  const pause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  // Sync with controlled index - track previous value with ref to avoid setState in effect
  const prevControlledIndexRef = useRef(controlledIndex)
  useEffect(() => {
    if (controlledIndex !== undefined) {
      const prevControlled = prevControlledIndexRef.current
      if (prevControlled !== controlledIndex && controlledIndex !== activeStep) {
        prevControlledIndexRef.current = controlledIndex
        // Use setTimeout to defer setState and avoid synchronous setState in effect
        const timeoutId = setTimeout(() => {
          setActiveStep(controlledIndex)
        }, 0)
        return () => clearTimeout(timeoutId)
      }
    }
    prevControlledIndexRef.current = controlledIndex
    return undefined
  }, [controlledIndex, activeStep])

  // Autoplay logic
  useEffect(() => {
    if (!autoplay || isPaused || maxSteps <= 1) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      const nextStep = (currentStep + 1) % maxSteps
      goToStep(nextStep)
    }, autoplayInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [autoplay, isPaused, currentStep, maxSteps, autoplayInterval, goToStep])

  return {
    activeStep: currentStep,
    handleNext,
    handleBack,
    goToStep,
    canGoNext: currentStep < maxSteps - 1,
    canGoBack: currentStep > 0,
    pause,
    resume,
    isPaused,
  }
}

