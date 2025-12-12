"use client";

/**
 * Login Test Page
 * 
 * Test page for the login form component.
 * Used to verify form validation and submission behavior.
 */

import { useState } from 'react';
import { Login } from '@/components/Login';
import { loginUser } from '@/lib/auth';
import { useAppStore } from '@/store/useAppStore';
import type { LoginFormData } from '@/types/login';

interface User {
    id?: string;
    username?: string;
    email?: string;
    [key: string]: unknown;
}

export default function LoginTestPage() {
    const [loading, setLoading] = useState(false);
    const setUserData = useAppStore((state) => state.setUserData);
    const setLoginError = useAppStore((state) => state.setLoginError);

    const handleSubmit = async (values: LoginFormData) => {
        const { username, password } = values;

        setLoading(true);
        setLoginError(null);

        try {
            const response = await loginUser(username, password);

            if (response.success) {
                setUserData((response.data?.user || {}) as User);
                // In a real app, you would redirect here
                // router.push('/dashboard');
            } else {
                setLoginError(response.error || 'Login failed');
            }
        } catch (error) {
            setLoginError(
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
                    <h1 className="text-3xl font-bold mb-2">Login Form Test Page</h1>
                    <p className="text-muted-foreground">
                        Test the login form validation and submission
                    </p>
                </div>

                <Login onSubmit={handleSubmit} loading={loading} />

                <div className="mt-8 max-w-md mx-auto p-4 bg-muted rounded-lg">
                    <h2 className="font-semibold mb-2">Test Instructions:</h2>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                        <li>Try submitting with empty fields</li>
                        <li>Try username less than 4 characters</li>
                        <li>Try username more than 30 characters</li>
                        <li>Try password less than 2 characters</li>
                        <li>Try password more than 20 characters</li>
                        <li>Try submitting without accepting ToS</li>
                        <li>Try submitting without accepting CoC</li>
                        <li>Check console for submission logs</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
