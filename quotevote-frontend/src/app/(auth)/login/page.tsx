'use client';

import { useState } from 'react';
import { Login } from '@/components/Login';
import { loginUser } from '@/lib/auth';
import { useAppStore } from '@/store/useAppStore';
import type { LoginFormData } from '@/types/login';
import type { TestUser } from '@/types/test';

/**
 * Login Page Component
 * 
 * Handles user authentication and login functionality.
 * Uses the Login component from @/components/Login and integrates
 * with the app store for state management.
 */
export default function LoginPage() {
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
                setUserData((response.data?.user || {}) as TestUser);
                // TODO: Redirect to dashboard after successful login
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
        <div className="w-full max-w-md">
            <Login onSubmit={handleSubmit} loading={loading} />
        </div>
    );
}
