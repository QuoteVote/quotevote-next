import { render, screen } from '@testing-library/react'
import { Input } from '@/components/ui/input'
import userEvent from '@testing-library/user-event'

describe('Input', () => {
    it('renders correctly', () => {
        render(<Input placeholder="Enter text" />)
        const input = screen.getByPlaceholderText('Enter text')
        expect(input).toBeInTheDocument()
    })

    it('handles value changes', async () => {
        const user = userEvent.setup()
        const handleChange = jest.fn()

        render(<Input onChange={handleChange} />)
        const input = screen.getByRole('textbox')

        await user.type(input, 'Hello')

        expect(handleChange).toHaveBeenCalled()
        expect(input).toHaveValue('Hello')
    })

    it('renders disabled state', () => {
        render(<Input disabled />)
        const input = screen.getByRole('textbox')
        expect(input).toBeDisabled()
    })

    it('applies custom classes', () => {
        render(<Input className="custom-input" />)
        const input = screen.getByRole('textbox')
        expect(input).toHaveClass('custom-input')
    })
})
