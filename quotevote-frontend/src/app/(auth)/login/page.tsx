'use client';

/**
 * Login Page – app/(auth)/login/page.tsx
 *
 * Renders the Login component under the (auth) route segment.
 * Replaces any legacy React Router logic with Next.js `useRouter`.
 * On a successful login the user is redirected to `/test` (main feed placeholder).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { toast } from 'sonner';

import { Login } from '@/app/components/Login';
import { useAppStore } from '@/store/useAppStore';
import type { LoginFormData } from '@/types/login';

// GraphQL login mutation. When the backend exposes a standardised `login`
// mutation this becomes the primary integration point.
const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        _id
        id
        username
        email
        name
        avatar
        admin
        accountStatus
      }
    }
  }
`;

interface LoginUser {
    _id: string;
    id?: string;
    username: string;
    email?: string;
    name?: string;
    avatar?: string;
    admin?: boolean;
    accountStatus?: string;
}

interface LoginMutationData {
    login: {
        token: string;
        user: LoginUser;
    };
}

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const setUserData = useAppStore((state) => state.setUserData);
    const setLoginError = useAppStore((state) => state.setLoginError);

    const [loginMutation] = useMutation<LoginMutationData>(LOGIN_MUTATION);

    const handleSubmit = async (values: LoginFormData) => {
        const { username, password } = values;
        setLoading(true);
        setLoginError(null);

        try {
            const result = await loginMutation({ variables: { username, password } });
            const { token, user } = result.data?.login ?? {};
            if (token && user) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('token', token);
                }
                setUserData(user as unknown as Record<string, unknown>);
                setLoginError(null);
                toast.success('Welcome back!');
                router.push('/test');
            }
        } catch (err) {
            const error = err as Error;
            const message = error.message || 'Login failed. Please try again.';
            setLoginError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return <Login onSubmit={handleSubmit} loading={loading} />;
}
