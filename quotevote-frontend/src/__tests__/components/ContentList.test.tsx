
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContentList from '@/components/ContentList'
import { ContentItem } from '@/types/contentList'

// Mock ResizeObserver for Radix UI
class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}
window.ResizeObserver = ResizeObserver;

// Mock PointerEvent and other DOM methods for Radix UI
class MockPointerEvent extends Event {
    button: number;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    constructor(type: string, props: PointerEventInit) {
        super(type, props);
        this.button = props.button || 0;
        this.ctrlKey = props.ctrlKey || false;
        this.metaKey = props.metaKey || false;
        this.shiftKey = props.shiftKey || false;
        this.altKey = props.altKey || false;
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
window.PointerEvent = MockPointerEvent as any;
window.HTMLElement.prototype.scrollIntoView = jest.fn();
window.HTMLElement.prototype.releasePointerCapture = jest.fn();
window.HTMLElement.prototype.hasPointerCapture = jest.fn();


// Mock data
const mockData: ContentItem[] = [
    {
        id: '1',
        title: 'First Item',
        content: 'This is the first item content.',
        upvotes: 10,
        downvotes: 2,
        url: 'https://example.com/1',
        createdAt: '2023-01-01T10:00:00Z',
    },
    {
        id: '2',
        title: 'Second Item',
        content: 'This is the second item content.',
        upvotes: 5,
        downvotes: 0,
        url: 'https://example.com/2',
        createdAt: '2023-01-02T10:00:00Z',
    },
    {
        id: '3',
        title: 'Third Item',
        content: 'This is the third item content. It is very long and should be expanded to see the full text. '.repeat(10),
        upvotes: 20,
        downvotes: 5,
        url: 'https://example.com/3',
        createdAt: '2023-01-03T10:00:00Z',
    },
    {
        id: '4',
        title: 'Fourth Item',
        content: 'This is the fourth item content.',
        upvotes: 8,
        downvotes: 1,
        url: 'https://example.com/4',
        createdAt: '2023-01-04T10:00:00Z',
    },
    {
        id: '5',
        title: 'Fifth Item',
        content: 'This is the fifth item content.',
        upvotes: 15,
        downvotes: 3,
        url: 'https://example.com/5',
        createdAt: '2023-01-05T10:00:00Z',
    },
    {
        id: '6',
        title: 'Sixth Item',
        content: 'This is the sixth item content (page 2).',
        upvotes: 12,
        downvotes: 4,
        url: 'https://example.com/6',
        createdAt: '2023-01-06T10:00:00Z',
    },
]

describe('ContentList Component', () => {
    it('renders content items correctly', () => {
        render(<ContentList data={mockData} />)

        // By default (newest first), items 6, 5, 4, 3, 2 should be visible.
        // Item 1 (oldest) should be on page 2.
        expect(screen.getByText('Sixth Item')).toBeInTheDocument()
        expect(screen.getByText('Second Item')).toBeInTheDocument()
        expect(screen.queryByText('First Item')).not.toBeInTheDocument()

        // Should show 5 items per page by default
        expect(screen.getAllByRole('article')).toHaveLength(5)
    })

    it('renders loading state', () => {
        render(<ContentList isLoading={true} />)
        expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('renders error state', () => {
        const errorMsg = 'Failed to load data'
        render(<ContentList error={errorMsg} />)
        expect(screen.getByText('Error')).toBeInTheDocument()
        expect(screen.getByText(errorMsg)).toBeInTheDocument()
    })

    it('renders empty state', () => {
        render(<ContentList data={[]} />)
        expect(screen.getByText('No content found')).toBeInTheDocument()
    })

    it('handles filtering', async () => {
        const user = userEvent.setup()
        render(<ContentList data={mockData} />)

        const searchInput = screen.getByPlaceholderText('Search content...')
        await user.type(searchInput, 'Second')

        expect(screen.getByText('Second Item')).toBeInTheDocument()
        expect(screen.queryByText('Sixth Item')).not.toBeInTheDocument()
    })

    it('handles sorting', async () => {
        const user = userEvent.setup()
        render(<ContentList data={mockData} />)

        // Open select
        const trigger = screen.getByRole('combobox')
        await user.click(trigger)

        // Select Oldest - use findByText which is more robust for some portals
        const oldestOption = await screen.findByText('Oldest')
        await user.click(oldestOption)

        // Sorted Oldest: 1, 2, 3, 4, 5. (Item 6 is on page 2)
        const firstItem = await screen.findByText('First Item')
        expect(firstItem).toBeInTheDocument()
        expect(screen.queryByText('Sixth Item')).not.toBeInTheDocument()
    })

    it('handles pagination', async () => {
        const user = userEvent.setup()
        render(<ContentList data={mockData} />)

        // Default Newest: items 6, 5, 4, 3, 2 are on page 1. item 1 is on page 2.
        expect(screen.queryByText('First Item')).not.toBeInTheDocument()

        const nextButton = screen.getByRole('button', { name: 'Next page' })
        await user.click(nextButton)

        expect(screen.getByText('First Item')).toBeInTheDocument()

        // Previous button should now be enabled/clickable
        const prevButton = screen.getByRole('button', { name: 'Previous page' })
        await user.click(prevButton)

        expect(screen.getByText('Sixth Item')).toBeInTheDocument()
    })

    it('renders truncated short preview without Read more button', () => {
        render(<ContentList data={mockData} />)

        expect(screen.getByText('Third Item')).toBeInTheDocument()

        // Truncated preview text with ellipsis
        expect(screen.getByText(/This is the third item content\./)).toBeInTheDocument()
        expect(screen.getByText(/\.\.\./)).toBeInTheDocument()

        // "Read more" button should not exist
        expect(screen.queryByText('Read more')).not.toBeInTheDocument()
        expect(screen.queryByText('Show more')).not.toBeInTheDocument()
    })

    it('clears filters when empty state action clicked', async () => {
        const user = userEvent.setup()
        render(<ContentList data={mockData} />)

        // Filter for something nonexistent
        const searchInput = screen.getByPlaceholderText('Search content...')
        await user.type(searchInput, 'Nonexistent')

        expect(screen.getByText('No content found')).toBeInTheDocument()

        const clearButton = screen.getByText('Clear all filters')
        await user.click(clearButton)

        expect(screen.queryByText('No content found')).not.toBeInTheDocument()
        expect(searchInput).toHaveValue('')
    })
})
