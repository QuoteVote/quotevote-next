import { useEffect, useState } from 'react'
import { isMobile as isDeviceMobile } from 'react-device-detect'

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const queries: Array<{ key: Breakpoint; query: string }> = [
    { key: 'xl', query: '(min-width: 1280px)' },
    { key: 'lg', query: '(min-width: 1024px)' },
    { key: 'md', query: '(min-width: 768px)' },
    { key: 'sm', query: '(min-width: 640px)' },
]

export function useWidth(): Breakpoint {
    const [bp, setBp] = useState<Breakpoint>('xs')

    useEffect(() => {
        if (typeof window === 'undefined') return
        const mqls = queries.map(({ key, query }) => ({ key, mql: window.matchMedia(query) }))

        const update = () => {
            const match = mqls.find(({ mql }) => mql.matches)
            setBp(match ? match.key : 'xs')
        }

        mqls.forEach(({ mql }) => mql.addEventListener?.('change', update))
        update()
        return () => {
            mqls.forEach(({ mql }) => mql.removeEventListener?.('change', update))
        }
    }, [])

    return bp
}

export function useMobileDetection(): boolean {
    const [isMobile, setIsMobile] = useState<boolean>(isDeviceMobile)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const mql = window.matchMedia('(max-width: 640px)')
        const update = () => setIsMobile(isDeviceMobile || mql.matches)
        mql.addEventListener?.('change', update)
        update()
        return () => mql.removeEventListener?.('change', update)
    }, [])

    return isMobile
}

// Combined hook for responsive behavior
export function useResponsive() {
    const width = useWidth()
    const isMobile = useMobileDetection()
    
    return {
        breakpoint: width,
        width,
        isMobile,
        isTablet: width === 'md' || width === 'lg',
        isDesktop: width === 'lg' || width === 'xl',
        isSmallScreen: width === 'xs' || width === 'sm',
        isMediumScreen: width === 'md' || width === 'lg',
        isLargeScreen: width === 'lg' || width === 'xl',
        isExtraLargeScreen: width === 'xl',
    }
}
