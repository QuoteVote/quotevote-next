'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select option...',
  label,
  error,
  errorMessage,
  className,
  disabled = false,
  allowCreate = true,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')

  const displayValue = React.useMemo(() => {
    if (!value) return ''
    if (typeof value === 'string') return value
    return value.title || ''
  }, [value])

  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options

    const lowerInput = inputValue.toLowerCase()
    const filtered = options.filter((option) =>
      option.title.toLowerCase().includes(lowerInput)
    )

    // Add create option if input doesn't match any existing option
    if (allowCreate && inputValue && !filtered.some((opt) => opt.title.toLowerCase() === lowerInput)) {
      return [
        ...filtered,
        { title: `Create new: "${inputValue}"`, inputValue } as ComboboxOption,
      ]
    }

    return filtered
  }, [options, inputValue, allowCreate])

  const handleSelect = (option: ComboboxOption) => {
    if (option.inputValue) {
      // Create new option
      onValueChange({ title: option.inputValue })
    } else {
      onValueChange(option)
    }
    setOpen(false)
    setInputValue('')
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <Label htmlFor="combobox-input" className={cn(error && 'text-destructive')}>
          {label}
        </Label>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between',
              error && 'border-destructive',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            disabled={disabled}
          >
            {displayValue || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0">
          <div className="p-4">
            <Input
              placeholder="Search or create..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-[200px] overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No options found.
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredOptions.map((option) => (
                    <button
                      key={option._id || option.title}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={cn(
                        'w-full flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                        (value && typeof value !== 'string' && value.title === option.title) && 'bg-accent'
                      )}
                    >
                      <span>{option.title}</span>
                      {value && typeof value !== 'string' && value.title === option.title && (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {error && errorMessage && (
        <p className="mt-1 text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  )
}

