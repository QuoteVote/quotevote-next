"use client"

import type { CSSProperties, MouseEventHandler } from 'react'
import { useMemo } from 'react'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps {
    src?: string | null
    alt?: string
    name?: string
    size?: Size | number
    className?: string
    style?: CSSProperties
    ariaLabel?: string
    onClick?: MouseEventHandler<HTMLDivElement>
}

const sizeMap: Record<Size, number> = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
}

function getInitials(name?: string): string {
    if (!name) return ''
    const parts = name.trim().split(/\s+/)
    const first = parts[0]?.[0] ?? ''
    const second = parts.length > 1 ? parts[1]?.[0] ?? '' : ''
    return (first + second).toUpperCase()
}

export default function Avatar({
    src,
    alt,
    name,
    size = 'md',
    className,
    style,
    ariaLabel,
    onClick,
}: AvatarProps) {
    const pixelSize = useMemo(() => (typeof size === 'number' ? size : sizeMap[size]), [size])
    const initials = useMemo(() => getInitials(name), [name])

    const baseClasses = `inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-700 overflow-hidden select-none ${className ?? ''}`
    const dimStyle: CSSProperties = { width: pixelSize, height: pixelSize, fontSize: Math.max(12, Math.floor(pixelSize / 2.8)) }
    const mergedStyle = { ...dimStyle, ...(style ?? {}) }

    return (
        <div
            role="img"
            aria-label={ariaLabel ?? alt ?? name ?? 'avatar'}
            className={baseClasses}
            style={mergedStyle}
            onClick={onClick}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt ?? name ?? 'avatar'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        const el = e.currentTarget
                        // Hide broken image and let fallback render
                        el.style.display = 'none'
                    }}
                />
            ) : initials ? (
                <span aria-hidden="true">{initials}</span>
            ) : (
                // Default icon-like fallback
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-2/3 h-2/3 text-gray-500"
                    aria-hidden="true"
                >
                    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7h2c0-2.761 2.239-5 5-5s5 2.239 5 5h2c0-3.866-3.134-7-7-7z" />
                </svg>
            )}
        </div>
    )
}
