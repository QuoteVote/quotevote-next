/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivityCard } from '@/components/ui/ActivityCard'

describe('ActivityCard', () => {
  const defaultProps = {
    username: 'testuser',
    date: '2024-01-01T12:00:00Z',
    content: 'Test activity content',
    post: {
      _id: 'post-1',
      title: 'Test Post',
      text: 'Test post text',
    },
    activityType: 'POSTED',
  }

  it('renders with required props', () => {
    render(<ActivityCard {...defaultProps} />)

    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByText(/Test activity content/i)).toBeInTheDocument()
  })

  it('renders with custom card color', () => {
    const { container } = render(
      <ActivityCard {...defaultProps} cardColor="#FF0000" />
    )

    const card = container.querySelector('[data-slot="card"]')
    expect(card).toHaveStyle({ backgroundColor: '#FF0000' })
  })

  it('calls onCardClick when card is clicked', async () => {
    const handleCardClick = jest.fn()
    const { container } = render(
      <ActivityCard {...defaultProps} onCardClick={handleCardClick} />
    )

    const card = container.querySelector('[data-slot="card"]')
    if (card) {
      await userEvent.click(card)
      expect(handleCardClick).toHaveBeenCalledTimes(1)
    }
  })

  it('calls onLike when bookmark button is clicked', async () => {
    const handleLike = jest.fn()
    render(<ActivityCard {...defaultProps} onLike={handleLike} />)

    const bookmarkButton = screen.getByLabelText(/bookmark/i)
    await userEvent.click(bookmarkButton)

    expect(handleLike).toHaveBeenCalled()
  })

  it('displays bookmark icon when liked', () => {
    render(<ActivityCard {...defaultProps} liked={true} />)

    expect(screen.getByLabelText(/unbookmark/i)).toBeInTheDocument()
  })

  it('displays unbookmark icon when not liked', () => {
    render(<ActivityCard {...defaultProps} liked={false} />)

    expect(screen.getByLabelText(/bookmark/i)).toBeInTheDocument()
  })

  it('displays interaction count', () => {
    render(
      <ActivityCard
        {...defaultProps}
        comments={[{ _id: '1' }]}
        votes={[{ _id: '2' }]}
      />
    )

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('handles empty interactions', () => {
    render(<ActivityCard {...defaultProps} />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })
})

