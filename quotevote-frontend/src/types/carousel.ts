import type { ReactNode } from 'react'

export interface CarouselProps {
  /** Array of carousel slide content */
  children: ReactNode[]
  /** Whether navigation buttons are always visible */
  navButtonsAlwaysVisible?: boolean
  /** Whether autoplay is enabled */
  autoplay?: boolean
  /** Initial active step index */
  activeStepProp?: number
  /** Callback when step changes */
  setActiveStepProp?: (step: number) => void
  /** Custom props for active indicator dot */
  activeIndicatorProps?: {
    className?: string
  }
  /** Custom props for inactive indicator dots */
  indicatorProps?: {
    className?: string
  }
  /** Controlled index (for external control) */
  index?: number
  /** Callback when carousel index changes */
  onChange?: (index: number) => void
  /** Whether to pause autoplay on hover */
  pauseOnHover?: boolean
  /** Autoplay interval in milliseconds */
  autoplayInterval?: number
  /** Whether to enable swipe gestures */
  enableSwipe?: boolean
  /** RTL direction support */
  rtl?: boolean
}

export interface UseCarouselOptions {
  /** Initial active step */
  initialStep?: number
  /** Total number of steps */
  maxSteps: number
  /** Controlled index (external control) */
  controlledIndex?: number
  /** Callback when step changes */
  onStepChange?: (step: number) => void
  /** Whether autoplay is enabled */
  autoplay?: boolean
  /** Autoplay interval in milliseconds */
  autoplayInterval?: number
}

export interface UseCarouselReturn {
  /** Current active step */
  activeStep: number
  /** Go to next step */
  handleNext: () => void
  /** Go to previous step */
  handleBack: () => void
  /** Go to specific step */
  goToStep: (step: number) => void
  /** Whether can go to next */
  canGoNext: boolean
  /** Whether can go back */
  canGoBack: boolean
  /** Pause autoplay */
  pause: () => void
  /** Resume autoplay */
  resume: () => void
  /** Whether autoplay is paused */
  isPaused: boolean
}

export interface CarouselContentProps {
  width?: string
  classes?: {
    [key: string]: string | undefined
  }
  setContentIndex?: (index: number) => void
}

export interface PlanCarouselProps {
  classes?: {
    activeIndicator?: string
    inactiveIndicator?: string
    opinionsText?: string
    bottomText?: string
    greenText?: string
    greenTitleText?: string
    requestInvite?: string
    sendEmail?: string
    sendEmailButton?: string
    [key: string]: string | undefined
  }
  setCarouselCurrentIndex?: (index: number) => void
}

