'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';

/**
 * Client-side component to handle auth-based redirection
 * Checks for token in localStorage and user data in Zustand store
 */
export const AuthRedirect = () => {
    const router = useRouter();
    const user = useAppStore((state) => state.user);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        if (token || (user?.data && Object.keys(user.data).length > 0)) {
            router.push('/search');
        }
    }, [user, router]);

    return null;
};
