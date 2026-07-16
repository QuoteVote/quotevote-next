'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface ComboboxOption {
  _id?: string
  title: string
  inputValue?: string
  [key: string]: unknown
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: ComboboxOption | { title: string } | string | null
  onValueChange: (value: ComboboxOption | { title: string } | null) => void
  placeholder?: string
  label?: string
  error?: boolean
  errorMessage?: string
  className?: string
  disabled?: boolean
  allowCreate?: boolean
  /** Prefer "top" when the trigger sits near the bottom of the viewport (e.g. mobile composer footer). */
  side?: 'top' | 'bottom' | 'left' | 'right'
  triggerTestId?: string
  createOptionTestId?: string
  errorTestId?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select or create a tag',
  label,
  error,
  errorMessage,
  className,
  disabled = false,
  allowCreate = true,
  side = 'bottom',
  triggerTestId,
  createOptionTestId,
  errorTestId,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [triggerWidth, setTriggerWidth] = React.useState<number>(220)

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
      if (triggerRef.current) {
        setTriggerWidth(triggerRef.current.offsetWidth)
      }
    } else {
      setInputValue('')
    }
  }, [open])

  const displayValue = React.useMemo(() => {
    if (!value) return ''
    if (typeof value === 'string') return value
    return value.title || ''
  }, [value])

  const filteredOptions = React.useMemo(() => {
    const lowerInput = inputValue.toLowerCase().trim()
    const filtered = lowerInput
      ? options.filter((opt) => opt.title.toLowerCase().includes(lowerInput))
      : options

    if (
      allowCreate &&
      lowerInput &&
      !filtered.some((opt) => opt.title.toLowerCase() === lowerInput)
    ) {
      return [...filtered, { title: inputValue.trim(), inputValue: inputValue.trim() } as ComboboxOption]
    }

    return filtered
  }, [options, inputValue, allowCreate])

  const handleSelect = (option: ComboboxOption) => {
    if (option.inputValue) {
      onValueChange({ title: option.inputValue })
    } else {
      onValueChange(option)
    }
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredOptions.length > 0) {
      e.preventDefault()
      handleSelect(filteredOptions[0])
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const isCreateOption = (option: ComboboxOption) => Boolean(option.inputValue)
  const isSelected = (option: ComboboxOption) =>
    !isCreateOption(option) &&
    value &&
    typeof value !== 'string' &&
    (value as ComboboxOption).title === option.title

  const listRef = React.useRef<HTMLDivElement>(null)

  // Dialog scroll-lock (react-remove-scroll) swallows wheel events on nested popovers.
  // Manually apply delta so the tag list scrolls with the mouse wheel.
  const handleListWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const el = listRef.current
    if (!el) return
    event.stopPropagation()
    el.scrollTop += event.deltaY
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <Label className={cn('mb-1 block text-sm font-medium', error && 'text-destructive')}>
          {label}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            data-testid={triggerTestId}
            className={cn(
              'w-full justify-between text-sm font-normal',
              !displayValue && 'text-muted-foreground',
              error && 'border-destructive',
            )}
          >
            <span className="truncate">{displayValue || placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="z-[80] p-0"
          style={{ width: Math.max(triggerWidth, 220) }}
          align="start"
          side={side}
          sideOffset={4}
          collisionPadding={16}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="border-b px-3 py-2">
            <Input
              ref={inputRef}
              placeholder="Search or type new tag name..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 border-0 p-0 text-sm shadow-none focus-visible:ring-0"
            />
          </div>

          {/* Options list — taller on short viewports so more choices stay reachable */}
          <div
            ref={listRef}
            data-scroll-lock-scrollable=""
            onWheel={handleListWheel}
            className="max-h-[min(40dvh,280px)] overflow-y-auto overscroll-contain py-1"
          >
            {filteredOptions.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {inputValue ? 'No matching tags.' : 'No tags yet. Type a name to create one.'}
              </p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option._id ?? option.title}
                  type="button"
                  data-testid={isCreateOption(option) ? createOptionTestId : undefined}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                    isSelected(option) && 'bg-accent',
                    isCreateOption(option) && 'text-[#52b274] font-medium',
                  )}
                >
                  {isCreateOption(option) ? (
                    <>
                      <Plus className="h-3.5 w-3.5 shrink-0" />
                      <span>Create &ldquo;{option.title}&rdquo;</span>
                    </>
                  ) : (
                    <>
                      <Check
                        className={cn(
                          'h-3.5 w-3.5 shrink-0',
                          isSelected(option) ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span>{option.title}</span>
                    </>
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {error && errorMessage && (
        <p className="mt-1 text-sm text-destructive" data-testid={errorTestId}>
          {errorMessage}
        </p>
      )}
    </div>
  )
}
