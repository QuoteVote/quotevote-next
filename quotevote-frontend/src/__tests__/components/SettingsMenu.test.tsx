import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SettingsMenu from '../../components/settings/SettingsMenu'

// Mock dependencies with Jest
jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }: any) => (
    <div data-testid="popover" data-open={open}>
      <div onClick={() => onOpenChange?.(!open)}>{children}</div>
    </div>
  ),
  PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
  PopoverTrigger: ({ children }: any) => <div data-testid="popover-trigger">{children}</div>,
}))

jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open, onOpenChange }: any) => (
    <div data-testid="sheet" data-open={open}>
      <div onClick={() => onOpenChange?.(!open)}>{children}</div>
    </div>
  ),
  SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
  SheetHeader: ({ children }: any) => <div data-testid="sheet-header">{children}</div>,
  SheetTitle: ({ children }: any) => <div data-testid="sheet-title">{children}</div>,
  SheetTrigger: ({ children }: any) => <div data-testid="sheet-trigger">{children}</div>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

jest.mock('@/components/settings/SettingsContent', () => {
  return function SettingsContent({ setOpen }: any) {
    return (
      <div data-testid="settings-content">
        <button onClick={() => setOpen(false)}>Close Settings</button>
      </div>
    )
  }
})

describe('SettingsMenu', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Desktop View', () => {
    it('renders settings button', () => {
      render(<SettingsMenu />)
      expect(screen.getByLabelText('Settings')).toBeInTheDocument()
    })

    it('renders Popover on desktop', () => {
      render(<SettingsMenu />)
      expect(screen.getByTestId('popover')).toBeInTheDocument()
    })

    it('opens popover on button click', async () => {
      render(<SettingsMenu />)
      const trigger = screen.getByTestId('popover-trigger')
      
      fireEvent.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByTestId('popover')).toHaveAttribute('data-open', 'true')
      })
    })

    it('applies correct icon size for medium', () => {
      render(<SettingsMenu fontSize="medium" />)
      const icon = screen.getByLabelText('Settings').querySelector('svg')
      expect(icon).toHaveClass('h-6', 'w-6')
    })

    it('applies correct icon size for small', () => {
      render(<SettingsMenu fontSize="small" />)
      const icon = screen.getByLabelText('Settings').querySelector('svg')
      expect(icon).toHaveClass('h-5', 'w-5')
    })

    it('applies correct icon size for large', () => {
      render(<SettingsMenu fontSize="large" />)
      const icon = screen.getByLabelText('Settings').querySelector('svg')
      expect(icon).toHaveClass('h-7', 'w-7')
    })
  })

  describe('Mobile View', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
    })

    it('renders Sheet on mobile', () => {
      render(<SettingsMenu />)
      expect(screen.getByTestId('sheet')).toBeInTheDocument()
    })

    it('opens sheet on button click', async () => {
      render(<SettingsMenu />)
      const trigger = screen.getByTestId('sheet-trigger')
      
      fireEvent.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'true')
      })
    })

    it('displays Settings title', () => {
      render(<SettingsMenu />)
      expect(screen.getByTestId('sheet-title')).toHaveTextContent('Settings')
    })
  })

  describe('Accessibility', () => {
    it('has proper aria-label', () => {
      render(<SettingsMenu />)
      expect(screen.getByLabelText('Settings')).toBeInTheDocument()
    })
  })
})
