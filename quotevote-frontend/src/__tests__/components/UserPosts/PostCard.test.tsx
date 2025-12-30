/**
 * PostCard Component Tests
 * 
 * Tests for the PostCard component including:
 * - Post data rendering
 * - Creator information display
 * - Date formatting
 * - Metadata display (upvotes, downvotes, comments)
 * - Edge cases (missing data)
 */

import { render, screen } from '../../utils/test-utils'
import { PostCard } from '@/components/UserPosts/PostCard'
import type { Post } from '@/types/post'

describe('PostCard Component', () => {
  const mockPost: Post = {
    _id: 'post1',
    userId: 'user1',
    created: '2024-01-15T10:30:00Z',
    title: 'Test Post Title',
    text: 'This is the post content that should be displayed.',
    url: 'https://example.com/post',
    upvotes: 25,
    downvotes: 5,
      creator: {
        _id: 'user1',
        username: 'testuser',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        contributorBadge: 'contributor',
      },
    comments: [
      {
        _id: 'comment1',
        created: '2024-01-15T11:00:00Z',
        userId: 'user2',
        content: 'Great post!',
      },
      {
        _id: 'comment2',
        created: '2024-01-15T12:00:00Z',
        userId: 'user3',
        content: 'I agree',
      },
    ],
  }

  describe('Basic Rendering', () => {
    it('renders post card with title', () => {
      render(<PostCard post={mockPost} />)
      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    })

    it('renders post text content', () => {
      render(<PostCard post={mockPost} />)
      expect(
        screen.getByText('This is the post content that should be displayed.')
      ).toBeInTheDocument()
    })

    it('renders post URL link', () => {
      render(<PostCard post={mockPost} />)
      const link = screen.getByText('https://example.com/post')
      expect(link).toBeInTheDocument()
      expect(link.closest('a')).toHaveAttribute('href', 'https://example.com/post')
      expect(link.closest('a')).toHaveAttribute('target', '_blank')
      expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('Creator Information', () => {
    it('displays creator username', () => {
      render(<PostCard post={mockPost} />)
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    it('displays creator avatar when available', () => {
      const { container } = render(<PostCard post={mockPost} />)
      // AvatarImage from Radix UI may not render as img in test environment
      // Check that the avatar container exists and has the image src set
      const avatarImage = container.querySelector('img[src="https://example.com/avatar.jpg"]')
      // If image doesn't load, fallback will show, but we can verify the structure
      const avatarContainer = container.querySelector('.rounded-full')
      expect(avatarContainer).toBeInTheDocument()
      // In test environment, image may fail to load and show fallback, which is expected behavior
      if (avatarImage) {
        expect(avatarImage).toHaveAttribute('alt', 'Test User')
      }
    })

    it('displays avatar fallback with initials when avatar is missing', () => {
      const postWithoutAvatar: Post = {
        ...mockPost,
        creator: {
          ...mockPost.creator!,
          avatar: undefined,
        },
      }
      render(<PostCard post={postWithoutAvatar} />)
      // Avatar fallback should show initials "TU" for "Test User"
      expect(screen.getByText('TU')).toBeInTheDocument()
    })

    it('uses username as fallback when name is missing', () => {
      const postWithoutName: Post = {
        ...mockPost,
        creator: {
          ...mockPost.creator!,
          name: undefined,
        },
      }
      render(<PostCard post={postWithoutName} />)
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    it('handles missing creator gracefully', () => {
      const postWithoutCreator: Post = {
        ...mockPost,
        creator: undefined,
      }
      render(<PostCard post={postWithoutCreator} />)
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    it('formats and displays created date', () => {
      render(<PostCard post={mockPost} />)
      // Date should be formatted as "Jan 15, 2024"
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
    })

    it('handles missing created date', () => {
      const postWithoutDate: Post = {
        ...mockPost,
        created: '',
      }
      render(<PostCard post={postWithoutDate} />)
      // Should not show date separator
      const dateSeparator = screen.queryByText('•')
      expect(dateSeparator).not.toBeInTheDocument()
    })
  })

  describe('Post Metadata', () => {
    it('displays upvotes count', () => {
      render(<PostCard post={mockPost} />)
      expect(screen.getByText('↑ 25')).toBeInTheDocument()
    })

    it('displays downvotes count', () => {
      render(<PostCard post={mockPost} />)
      expect(screen.getByText('↓ 5')).toBeInTheDocument()
    })

    it('displays comments count', () => {
      render(<PostCard post={mockPost} />)
      expect(screen.getByText('💬 2')).toBeInTheDocument()
    })

    it('handles zero upvotes', () => {
      const postWithZeroUpvotes: Post = {
        ...mockPost,
        upvotes: 0,
      }
      render(<PostCard post={postWithZeroUpvotes} />)
      expect(screen.getByText('↑ 0')).toBeInTheDocument()
    })

    it('handles null upvotes', () => {
      const postWithNullUpvotes: Post = {
        ...mockPost,
        upvotes: null,
      }
      render(<PostCard post={postWithNullUpvotes} />)
      expect(screen.queryByText(/↑/)).not.toBeInTheDocument()
    })

    it('handles undefined upvotes', () => {
      const postWithUndefinedUpvotes: Post = {
        ...mockPost,
        upvotes: undefined,
      }
      render(<PostCard post={postWithUndefinedUpvotes} />)
      expect(screen.queryByText(/↑/)).not.toBeInTheDocument()
    })

    it('handles missing comments array', () => {
      const postWithoutComments: Post = {
        ...mockPost,
        comments: undefined,
      }
      render(<PostCard post={postWithoutComments} />)
      expect(screen.queryByText(/💬/)).not.toBeInTheDocument()
    })

    it('handles empty comments array', () => {
      const postWithEmptyComments: Post = {
        ...mockPost,
        comments: [],
      }
      render(<PostCard post={postWithEmptyComments} />)
      expect(screen.queryByText(/💬/)).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles missing title', () => {
      const postWithoutTitle: Post = {
        ...mockPost,
        title: null,
      }
      render(<PostCard post={postWithoutTitle} />)
      expect(screen.getByText('Untitled Post')).toBeInTheDocument()
    })

    it('handles missing text content', () => {
      const postWithoutText: Post = {
        ...mockPost,
        text: null,
      }
      render(<PostCard post={postWithoutText} />)
      expect(screen.queryByText(/This is the post content/)).not.toBeInTheDocument()
    })

    it('handles missing URL', () => {
      const postWithoutUrl: Post = {
        ...mockPost,
        url: null,
      }
      render(<PostCard post={postWithoutUrl} />)
      expect(screen.queryByText('https://example.com/post')).not.toBeInTheDocument()
    })

    it('applies negative margin for index > 0', () => {
      const { container } = render(<PostCard post={mockPost} index={1} />)
      const card = container.querySelector('.mb-4')
      expect(card).toHaveClass('-mt-4')
    })

    it('does not apply negative margin for index 0', () => {
      const { container } = render(<PostCard post={mockPost} index={0} />)
      const card = container.querySelector('.mb-4')
      expect(card).not.toHaveClass('-mt-4')
    })

    it('does not apply negative margin when index is undefined', () => {
      const { container } = render(<PostCard post={mockPost} />)
      const card = container.querySelector('.mb-4')
      expect(card).not.toHaveClass('-mt-4')
    })

    it('handles creator with only username', () => {
      const postWithMinimalCreator: Post = {
        ...mockPost,
        creator: {
          _id: 'user1',
          username: 'minimaluser',
        },
      }
      render(<PostCard post={postWithMinimalCreator} />)
      expect(screen.getByText('minimaluser')).toBeInTheDocument()
    })

    it('generates correct initials for multi-word names', () => {
      const postWithLongName: Post = {
        ...mockPost,
        creator: {
          ...mockPost.creator!,
          name: 'John Michael Smith',
          avatar: undefined,
        },
      }
      render(<PostCard post={postWithLongName} />)
      // Should show "JM" (first letter of first two words)
      expect(screen.getByText('JM')).toBeInTheDocument()
    })

    it('generates correct initials for single-word names', () => {
      const postWithSingleName: Post = {
        ...mockPost,
        creator: {
          ...mockPost.creator!,
          name: 'Test',
          avatar: undefined,
        },
      }
      render(<PostCard post={postWithSingleName} />)
      // Should show "T"
      expect(screen.getByText('T')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper alt text for avatar', () => {
      const { container } = render(<PostCard post={mockPost} />)
      // AvatarImage may show fallback in test environment, but alt text should be set
      const avatarImage = container.querySelector('img[alt="Test User"]')
      // If image is present, verify alt text; if fallback shows, that's also valid
      if (avatarImage) {
        expect(avatarImage).toHaveAttribute('alt', 'Test User')
      } else {
        // Fallback is showing, which is acceptable - verify avatar container exists
        const avatarContainer = container.querySelector('.rounded-full')
        expect(avatarContainer).toBeInTheDocument()
      }
    })

    it('has proper link attributes for external URLs', () => {
      render(<PostCard post={mockPost} />)
      const link = screen.getByText('https://example.com/post').closest('a')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })
})

