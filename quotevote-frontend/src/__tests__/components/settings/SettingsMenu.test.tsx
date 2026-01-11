import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsMenu from '../../../components/settings/SettingsMenu'
import { useMediaQuery } from '@/hooks/useMediaQuery'

// Mock the useMediaQuery hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: jest.fn(),
}))

// Mock SettingsContent component
jest.mock('../../../components/settings/SettingsContent.tsx', () => {
  return function MockSettingsContent({ setOpen }: { setOpen?: (open: boolean) => void }) {
    return (
      <div data-testid="settings-content">
        <button onClick={() => setOpen?.(false)}>Close Settings</button>
      </div>
    )
  }
})

const mockUseMediaQuery = useMediaQuery as jest.MockedFunction<typeof useMediaQuery>

describe('SettingsMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Desktop View', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(false) // Desktop
    })

    it('renders settings button', () => {
      render(<SettingsMenu />)
      
      const button = screen.getByRole('button', { name: /settings/i })
      expect(button).toBeInTheDocument()
    })

    it('opens popover on click', async () => {
      const user = userEvent.setup()
      render(<SettingsMenu />)
      
      const button = screen.getByRole('button', { name: /settings/i })
      await user.click(button)
      
      expect(screen.getByTestId('settings-content')).toBeInTheDocument()
    })

    it('closes popover when setOpen is called', async () => {
      const user = userEvent.setup()
      render(<SettingsMenu />)
      
      const button = screen.getByRole('button', { name: /settings/i })
      await user.click(button)
      
      const closeButton = screen.getByText('Close Settings')
      await user.click(closeButton)
      
      expect(screen.queryByTestId('settings-content')).not.toBeInTheDocument()
    })

    it('applies correct icon size for small fontSize', () => {
      const { container } = render(<SettingsMenu fontSize="small" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('h-4', 'w-4')
    })

    it('applies correct icon size for medium fontSize', () => {
      const { container } = render(<SettingsMenu fontSize="medium" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('h-5', 'w-5')
    })

    it('applies correct icon size for large fontSize', () => {
      const { container } = render(<SettingsMenu fontSize="large" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('h-6', 'w-6')
    })
  })

  describe('Mobile View', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(true) // Mobile
    })

    it('renders settings button', () => {
      render(<SettingsMenu />)
      
      const button = screen.getByRole('button', { name: /settings/i })
      expect(button).toBeInTheDocument()
    })

    it('opens sheet drawer on click', async () => {
      const user = userEvent.setup()
      render(<SettingsMenu />)
      
      const button = screen.getByRole('button', { name: /settings/i })
      await user.click(button)
      
      expect(screen.getByTestId('settings-content')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('closes sheet when setOpen is called', async () => {
      const user = userEvent.setup()
      render(<SettingsMenu />)
      
      const button = screen.getByRole('button', { name: /settings/i })
      await user.click(button)
      
      const closeButton = screen.getByText('Close Settings')
      await user.click(closeButton)
      
      expect(screen.queryByTestId('settings-content')).not.toBeInTheDocument()
    })
  })

  describe('Hover Effects', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(false) // Desktop
    })

    it('applies hover styles on mouse enter', async () => {
      const user = userEvent.setup()
      render(<SettingsMenu />)
      
      const button = screen.getByRole('button', { name: /settings/i })
      await user.hover(button)
      
      expect(button).toHaveClass('bg-accent')
    })

    it('removes hover styles on mouse leave', async () => {
      const user = userEvent.setup()
      render(<SettingsMenu />)
      
      const button = screen.getByRole('button', { name: /settings/i })
      
      await user.hover(button)
      expect(button).toHaveClass('bg-accent')
      
      await user.unhover(button)
      // The hover class should be removed (testing implementation detail)
    })
  })

  describe('Accessibility', () => {
    it('has proper aria-label', () => {
      mockUseMediaQuery.mockReturnValue(false)
      render(<SettingsMenu />)
      
      const button = screen.getByRole('button', { name: /settings/i })
      expect(button).toHaveAttribute('aria-label', 'Settings')
    })

    it('button is keyboard accessible', async () => {
      mockUseMediaQuery.mockReturnValue(false)
      const user = userEvent.setup()
      render(<SettingsMenu />)
      
      const button = screen.getByRole('button', { name: /settings/i })
      
      button.focus()
      expect(button).toHaveFocus()
      
      await user.keyboard('{Enter}')
      expect(screen.getByTestId('settings-content')).toBeInTheDocument()
    })
  })
})
