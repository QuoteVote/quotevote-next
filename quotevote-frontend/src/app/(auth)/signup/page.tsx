'use client';

/**
 * Signup Page – app/(auth)/signup/page.tsx
 *
 * Renders the SignupForm component under the (auth) route segment.
 * Accepts `token`, `userId`, and `email` query params from an invite email link
 * and calls the UPDATE_USER GraphQL mutation to complete registration.
 *
 * Expected URL: /auth/signup?token=<invite-token>&userId=<user-id>&email=<email>
 *
 * NOTE: Wrapped in Suspense because useSearchParams() requires it in Next.js 15+.
 */

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { toast } from 'sonner';

import { SignupForm } from '@/components/SignupForm';
import { Loader2 } from 'lucide-react';
import { UPDATE_USER } from '@/graphql/mutations';
import type { SignupFormData } from '@/types/signup';

interface UpdateUserData {
    updateUser: {
        _id: string;
        username: string;
        email: string;
    };
}

/**
 * Inner component that reads search params and renders the SignupForm.
 * Must live inside a Suspense boundary because of useSearchParams().
 */
function SignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    const token = searchParams.get('token') ?? '';
    const userId = searchParams.get('userId') ?? '';
    const email = searchParams.get('email') ?? '';

    const [updateUser] = useMutation<UpdateUserData>(UPDATE_USER);

    const handleSubmit = async (values: SignupFormData) => {
        setLoading(true);
        try {
            const result = await updateUser({
                variables: {
                    user: {
                        _id: userId,
                        username: values.username,
                        email: values.email,
                        password: values.password,
                        token,
                    },
                },
            });
            if (result.data?.updateUser) {
                toast.success('Registration complete! You can now log in.');
                router.push('/auth/login');
            }
        } catch (err) {
            const error = err as Error;
            toast.error(error.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const invitedUser = { _id: userId, email };

    return (
        <SignupForm
            user={invitedUser}
            token={token}
            onSubmit={handleSubmit}
            loading={loading}
        />
    );
}

/**
 * Page component — wraps the inner content in Suspense so that
 * useSearchParams() in SignupContent is fully supported.
 */
export default function SignupPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-background">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            }
        >
            <SignupContent />
        </Suspense>
    );
}
