import { render, screen } from '@testing-library/react'
import PrivacyPage, { metadata } from '@/app/privacy/page'

describe('Privacy Notice', () => {
  it('publishes the approved notice with all sections and a contact', () => {
    render(<PrivacyPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Quote.Vote Privacy Notice' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '17. Contact' })).toBeInTheDocument()
    expect(screen.getByText(/Railway/)).toBeInTheDocument()
    expect(screen.getByText(/Netlify/)).toBeInTheDocument()
    expect(screen.getByText(/MongoDB/)).toBeInTheDocument()
    expect(screen.getByText(/SendGrid/)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /admin@quote.vote/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
    expect(metadata.title).toBe('Privacy Notice - Quote.Vote')
  })
})
