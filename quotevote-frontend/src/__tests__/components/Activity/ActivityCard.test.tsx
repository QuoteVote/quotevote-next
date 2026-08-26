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

  // RC1-028 / #380: POSTED activity cards share feed PostCard blue chrome.
  describe('Card Chrome (RC1-028 / #380)', () => {
    it('applies standard blue border chrome for POSTED cards', () => {
      const { container } = render(<ActivityCard {...defaultProps} />)

      const card = container.querySelector('[data-slot="card"]') as HTMLElement
      expect(card).toHaveAttribute('data-chrome', 'standard-blue')
      expect(card.style.border).toContain('#56b3ff')
      expect(card.style.borderBottom).toContain('#56b3ff')
      // Fill stays theme/card — not a vote-colored background
      expect(card.style.backgroundColor).toBe('')
    })

    it('keeps activity fill colors for non-POSTED cards', () => {
      const { container } = render(
        <ActivityCard
          {...defaultProps}
          activityType="UPVOTED"
          cardColor="#52b274"
        />
      )

      const card = container.querySelector('[data-slot="card"]') as HTMLElement
      expect(card).toHaveAttribute('data-chrome', 'activity')
      expect(card).toHaveStyle({ backgroundColor: '#52b274' })
      expect(card.style.border).not.toContain('#56b3ff')
    })

    it('falls back to white fill for non-POSTED cards without cardColor', () => {
      const { container } = render(
        <ActivityCard {...defaultProps} activityType="COMMENTED" />
      )

      const card = container.querySelector('[data-slot="card"]')
      expect(card).toHaveStyle({ backgroundColor: '#FFFFFF' })
    })
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

  describe('Preview Truncation (#474)', () => {
    it('renders short activity content without ellipsis', () => {
      const shortContent = 'Short activity text'
      render(<ActivityCard {...defaultProps} content={shortContent} />)

      expect(screen.getByText(`"${shortContent}"`)).toBeInTheDocument()
    })

    it('truncates activity content over 150 chars with ellipsis and applies line-clamp-3', () => {
      const longContent = 'X'.repeat(250)
      const { container } = render(<ActivityCard {...defaultProps} content={longContent} />)

      const expectedContent = `"${'X'.repeat(150)}..."`
      expect(screen.getByText(expectedContent)).toBeInTheDocument()

      const contentP = container.querySelector('.line-clamp-3')
      expect(contentP).toBeInTheDocument()
    })
  })

  it('aligns the avatar with the username and stacks the timestamp on small screens', () => {
    render(<ActivityCard {...defaultProps} />)

    expect(screen.getByTestId('activity-content')).toHaveClass('items-start')
    expect(screen.getByTestId('activity-header')).toHaveClass('flex-col')
    expect(screen.getByTestId('activity-header')).toHaveClass('sm:flex-row')
  })
})

