'use client'

import { useState, useEffect } from 'react'
import type { ResponsiveBreakpoint, UseResponsiveReturn } from '@/types/hooks'

/**
 * Tailwind breakpoints (matching default Tailwind CSS configuration)
 */
const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const

/**
 * Custom hook to get responsive breakpoint information
 * Replaces Material-UI useTheme/useMediaQuery with Tailwind breakpoints
 * @returns Object containing current breakpoint and responsive boolean helpers
 */
export const useResponsive = (): UseResponsiveReturn => {
    const [breakpoint, setBreakpoint] = useState<ResponsiveBreakpoint>('xs')
    const [windowWidth, setWindowWidth] = useState<number>(
        typeof window !== 'undefined' ? window.innerWidth : 0
    )

    useEffect(() => {
        // Handle SSR - return early if window is not defined
        if (typeof window === 'undefined') return

        const handleResize = (): void => {
            setWindowWidth(window.innerWidth)
        }

        // Set initial width
        handleResize()

        // Add event listener
        window.addEventListener('resize', handleResize)

        // Cleanup
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        // Determine current breakpoint based on window width
        if (windowWidth >= BREAKPOINTS['2xl']) {
            setBreakpoint('2xl')
        } else if (windowWidth >= BREAKPOINTS.xl) {
            setBreakpoint('xl')
        } else if (windowWidth >= BREAKPOINTS.lg) {
            setBreakpoint('lg')
        } else if (windowWidth >= BREAKPOINTS.md) {
            setBreakpoint('md')
        } else if (windowWidth >= BREAKPOINTS.sm) {
            setBreakpoint('sm')
        } else {
            setBreakpoint('xs')
        }
    }, [windowWidth])

    return {
        breakpoint,
        isSmallScreen: windowWidth < BREAKPOINTS.sm,
        isMediumScreen: windowWidth >= BREAKPOINTS.md,
        isLargeScreen: windowWidth >= BREAKPOINTS.lg,
        isExtraLargeScreen: windowWidth >= BREAKPOINTS.xl,
    }
}

export default useResponsive
