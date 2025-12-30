'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import SettingsContent from '../settings/SettingsContent'

// Hook for mobile detection
export function useMobileDetection(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 768
}

interface SettingsMenuProps {
  fontSize?: 'small' | 'medium' | 'large'
}

export default function SettingsMenu({ fontSize = 'medium' }: SettingsMenuProps) {
  const isMobileDevice = useMobileDetection()
  const [open, setOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Icon size mapping
  const iconSizeMap = {
    small: 'h-5 w-5',
    medium: 'h-6 w-6',
    large: 'h-7 w-7',
  }

  const iconSize = iconSizeMap[fontSize]

  const SettingsButton = (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Settings"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <Settings
        className={cn(
          iconSize,
          'transition-all duration-200',
          isHovered && 'rotate-90'
        )}
      />
    </Button>
  )

  // Mobile drawer view
  if (isMobileDevice) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {SettingsButton}
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full max-w-[400px] border-none bg-gradient-to-br from-[#1BB5D8] via-[#2B8FC7] to-[#4066EC] p-0 sm:w-[400px]"
        >
          <SheetHeader className="border-b border-white/10 px-6 py-4">
            <SheetTitle className="text-left text-xl font-semibold text-white">
              Settings
            </SheetTitle>
          </SheetHeader>
          <SettingsContent setOpen={setOpen} />
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop popover view
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {SettingsButton}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        className={cn(
          'w-[400px] border-none p-0',
          'bg-gradient-to-br from-[#1BB5D8] via-[#2B8FC7] to-[#4066EC]',
          'shadow-lg'
        )}
      >
        <SettingsContent setOpen={setOpen} />
      </PopoverContent>
    </Popover>
  )
}
