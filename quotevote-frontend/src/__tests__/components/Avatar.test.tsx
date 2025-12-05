import { render, screen } from '@testing-library/react'
import Avatar from '@/components/Avatar'

describe('Avatar component', () => {
    it('renders image when src is provided', () => {
        render(<Avatar src="/icons/user.png" alt="User avatar" name="Ada Lovelace" size="md" />)
        const container = screen.getByRole('img')
        expect(container).toBeInTheDocument()
        expect(container).toHaveAttribute('aria-label', 'User avatar')
        const innerImg = container.querySelector('img')
        expect(innerImg).not.toBeNull()
        expect(innerImg?.getAttribute('src')).toBe('/icons/user.png')
    })

    it('renders initials when no src but name is provided', () => {
        render(<Avatar name="Grace Hopper" size={40} />)
        const container = screen.getByRole('img')
        expect(container).toBeInTheDocument()
        expect(container).toHaveTextContent('GH')
    })

    it('renders default icon when neither src nor name provided', () => {
        render(<Avatar size="sm" />)
        const container = screen.getByRole('img')
        expect(container).toBeInTheDocument()
        // Should contain an SVG fallback (aria-hidden)
        const svg = container.querySelector('svg')
        expect(svg).not.toBeNull()
    })
})
