import { render, screen, waitFor } from '@testing-library/react'
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog'
import userEvent from '@testing-library/user-event'

describe('Dialog', () => {
    it('opens and closes correctly', async () => {
        const user = userEvent.setup()

        render(
            <Dialog>
                <DialogTrigger>Open Dialog</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dialog Title</DialogTitle>
                        <DialogDescription>Dialog Description</DialogDescription>
                    </DialogHeader>
                    <p>Dialog Content</p>
                    <DialogFooter>
                        <DialogClose>Close Dialog</DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )

        // Dialog content should not be visible initially
        expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()

        // Click trigger
        await user.click(screen.getByText('Open Dialog'))

        // Dialog content should be visible
        expect(screen.getByText('Dialog Title')).toBeInTheDocument()
        expect(screen.getByText('Dialog Description')).toBeInTheDocument()
        expect(screen.getByText('Dialog Content')).toBeInTheDocument()

        // Click close button
        await user.click(screen.getByText('Close Dialog'))

        // Wait for dialog to close (animation)
        await waitFor(() => {
            expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
        })
    })
})
