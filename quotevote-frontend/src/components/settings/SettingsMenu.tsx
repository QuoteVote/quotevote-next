'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { cn } from '@/lib/utils'
import SettingsContent from './SettingsContent'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { SettingsMenuProps } from '@/types/settings'

export default function SettingsMenu({ fontSize = 'medium' }: SettingsMenuProps) {
  const [open, setOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const handleToggle = () => {
    setOpen(!open)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const iconSizeMap = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-6 w-6',
    inherit: 'h-5 w-5',
  }

  const iconSize = iconSizeMap[fontSize]

  // Mobile Sheet UI
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'relative transition-all duration-200',
              isHovered && 'bg-accent'
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label="Settings"
          >
            <Settings
              className={cn(
                iconSize,
                'transition-transform duration-200',
                isHovered && 'rotate-45 scale-110'
              )}
            />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full max-w-[400px] bg-gradient-to-br from-[#1BB5D8] to-[#4066EC] border-none p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle className="text-white font-semibold text-xl">
              Settings
            </SheetTitle>
          </SheetHeader>
          <div className="px-2">
            <SettingsContent setOpen={setOpen} />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop Popover UI
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative transition-all duration-200',
            isHovered && 'bg-accent'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleToggle}
          aria-label="Settings"
        >
          <Settings
            className={cn(
              iconSize,
              'transition-transform duration-200',
              isHovered && 'rotate-45 scale-110'
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-auto p-0 bg-gradient-to-br from-[#1BB5D8] to-[#4066EC] border-none shadow-2xl"
        sideOffset={8}
      >
        <div className="relative">
          {/* Tooltip arrow effect */}
          <div className="absolute -top-2 left-4 w-4 h-4 bg-[#1BB5D8] rotate-45" />
          <SettingsContent setOpen={setOpen} />
        </div>
      </PopoverContent>
    </Popover>
  )
}
