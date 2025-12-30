"use client"

import { useState } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

const BuggyComponent = () => {
    const [clicked, setClicked] = useState(false)

    if (clicked) {
        throw new Error('This is a simulated render error for testing!')
    }

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
                Clicking the button below will throw an error inside this component.
                The ErrorBoundary should catch it and display the fallback UI.
            </p>
            <Button variant="destructive" onClick={() => setClicked(true)}>
                Trigger Error
            </Button>
        </div>
    )
}

export default function ErrorBoundaryTestPage() {
    return (
        <div className="container mx-auto py-10 px-4 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8 text-center">ErrorBoundary Component Test</h1>

            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Default Error Boundary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ErrorBoundary>
                            <BuggyComponent />
                        </ErrorBoundary>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Custom Fallback UI</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ErrorBoundary
                            fallback={
                                <div className="p-4 bg-orange-100 text-orange-800 rounded-lg border border-orange-200">
                                    <strong>Custom Fallback:</strong> Oops! The widget crashed, but the app is fine.
                                </div>
                            }
                        >
                            <BuggyComponent />
                        </ErrorBoundary>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
