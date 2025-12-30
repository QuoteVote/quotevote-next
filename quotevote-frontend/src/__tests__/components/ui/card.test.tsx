import { render, screen } from '@testing-library/react'
import {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card'

describe('Card', () => {
    it('renders all parts correctly', () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card Description</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Card Content</p>
                </CardContent>
                <CardFooter>
                    <p>Card Footer</p>
                </CardFooter>
            </Card>
        )

        expect(screen.getByText('Card Title')).toBeInTheDocument()
        expect(screen.getByText('Card Description')).toBeInTheDocument()
        expect(screen.getByText('Card Content')).toBeInTheDocument()
        expect(screen.getByText('Card Footer')).toBeInTheDocument()
    })

    it('applies custom classes', () => {
        render(
            <Card className="custom-class">
                <CardContent className="content-class">Content</CardContent>
            </Card>
        )

        // We can check if the class is applied to the container
        // Since Card renders a div with data-slot="card", we can query by that if we add a test-id or just look for the text parent
        const content = screen.getByText('Content')
        expect(content).toHaveClass('content-class')
        expect(content.parentElement).toHaveClass('custom-class')
    })
})
