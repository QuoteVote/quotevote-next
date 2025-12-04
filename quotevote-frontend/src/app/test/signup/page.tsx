"use client";

/**
 * Signup Test Page
 * 
 * Test page for the signup form component.
 * Used to verify form validation and submission behavior.
 */

import { useState } from 'react';
import { SignupForm } from '@/components/SignupForm';
import type { SignupFormData } from '@/types/signup';

export default function SignupTestPage() {
    const [loading, setLoading] = useState(false);
    const [signupError, setSignupError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Mock user data (would come from invitation/email verification in real app)
    const mockUser = {
        _id: 'test-user-id',
        email: 'test@example.com',
    };

    const mockToken = 'test-token-123';

    const handleSubmit = async (values: SignupFormData) => {
        const { username, email } = values;

        setLoading(true);
        setSignupError(null);
        setSuccessMessage(null);

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Mock successful signup
            setSuccessMessage(`Successfully registered user: ${username} with email: ${email}`);

            // In a real app, you would:
            // 1. Call the UPDATE_USER mutation
            // 2. Store the token
            // 3. Redirect to /search or dashboard
        } catch (error) {
            setSignupError(
                error instanceof Error ? error.message : 'An unexpected error occurred'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="container mx-auto py-8">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold mb-2">Signup Form Test Page</h1>
                    <p className="text-muted-foreground">
                        Test the signup form validation and submission
                    </p>
                </div>

                {successMessage && (
                    <div className="max-w-md mx-auto mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 rounded-lg">
                        <p className="font-semibold">Success!</p>
                        <p className="text-sm">{successMessage}</p>
                    </div>
                )}

                <SignupForm
                    user={mockUser}
                    token={mockToken}
                    onSubmit={handleSubmit}
                    loading={loading}
                    signupError={signupError}
                />

                <div className="mt-8 max-w-md mx-auto p-4 bg-muted rounded-lg">
                    <h2 className="font-semibold mb-2">Test Instructions:</h2>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                        <li>Email field is pre-filled and disabled</li>
                        <li>Try username less than 4 characters</li>
                        <li>Try username more than 20 characters</li>
                        <li>Try password less than 8 characters</li>
                        <li>Try password without uppercase letter</li>
                        <li>Try password without lowercase letter</li>
                        <li>Try password without number</li>
                        <li>Try submitting without accepting ToS</li>
                        <li>Try submitting without accepting CoC</li>
                        <li>Submit with valid data to see success message</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
