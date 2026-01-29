'use client';

/**
 * RequestInviteDialog Component
 * 
 * Dialog component for requesting platform access via email invitation.
 * Migrated from Material UI to shadcn/ui components.
 */

import { useState, useEffect, useRef } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { REQUEST_USER_ACCESS_MUTATION } from '@/graphql/mutations';
import { GET_CHECK_DUPLICATE_EMAIL } from '@/graphql/queries';
import { requestAccessEmailSchema } from '@/lib/validation/requestAccessSchema';
import type { RequestInviteDialogProps } from '@/types/components';

export function RequestInviteDialog({ open, onClose }: RequestInviteDialogProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const client = useApolloClient();
  const [requestUserAccess, { loading }] = useMutation(
    REQUEST_USER_ACCESS_MUTATION
  );

  const handleSubmit = async () => {
    setError('');

    // Validate email using Zod schema
    const validationResult = requestAccessEmailSchema.safeParse({ email });

    if (!validationResult.success) {
      setError(
        validationResult.error.issues[0]?.message || 'Please enter a valid email address'
      );
      return;
    }

    try {
      // Check for duplicate email
      const checkDuplicate = await client.query({
        query: GET_CHECK_DUPLICATE_EMAIL,
        variables: { email },
        fetchPolicy: 'network-only',
      });

      if (
        checkDuplicate &&
        Array.isArray((checkDuplicate.data as { checkDuplicateEmail?: unknown[] })?.checkDuplicateEmail) &&
        ((checkDuplicate.data as { checkDuplicateEmail?: unknown[] })?.checkDuplicateEmail?.length || 0) > 0
      ) {
        setError(
          'This email address has already been used to request an invite.'
        );
        return;
      }

      // Submit request
      await requestUserAccess({
        variables: { requestUserAccessInput: { email } },
      });
      
      setSubmitted(true);
      toast.success('Request submitted successfully!');
      
      // Auto-close after 3 seconds with cleanup
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      const error = err as Error;
      setError('An unexpected error occurred. Please try again later.');
      toast.error('Failed to submit request');
      console.error(error);
    }
  };

  const handleClose = () => {
    // Clear timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setEmail('');
    setError('');
    setSubmitted(false);
    onClose();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Get current URL path to pass as redirect parameter (including hash)
  const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
  const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="flex flex-col items-center space-y-4 py-4">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-semibold text-gray-900">
                Thank you for joining us
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="text-center text-gray-600 text-sm leading-relaxed">
              When an account becomes available, an invite will be sent to the
              email provided.
            </DialogDescription>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <DialogHeader>
              <DialogTitle className="text-center text-base font-medium text-gray-900 leading-relaxed">
                You need an account to contribute. Viewing is public, but
                posting, voting, and quoting require an invite.
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="email" className="sr-only">
                Email Address
              </Label>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 transition-all duration-300 focus-within:border-[#52b274] focus-within:shadow-[0_0_0_4px_rgba(82,178,116,0.1)] focus-within:bg-gradient-to-br focus-within:from-white focus-within:to-gray-50" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter Your Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="relative bg-transparent border-none outline-none w-full text-base sm:text-lg text-gray-800 font-medium placeholder:text-gray-500 focus:ring-0 focus-visible:ring-0"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 text-center">
                <p className="text-red-800 text-sm sm:text-[0.95rem] font-medium m-0">
                  {error}
                </p>
              </div>
            )}

            <div className="text-center py-2">
              <Link
                href="/auth/request-access#mission"
                className="text-[#52b274] no-underline text-sm sm:text-[0.95rem] font-medium transition-colors duration-300 hover:text-[#4a9f63] hover:underline"
              >
                Learn more about our mission here
              </Link>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#52b274] text-white hover:bg-[#4a9f63] rounded-lg py-3 px-6 text-base font-medium transition-colors duration-300"
            >
              {loading ? 'Submitting...' : 'Request Invite'}
            </Button>

            <p className="text-center text-sm text-gray-600 mt-4">
              Already have an account?{' '}
              <Link
                href={loginUrl}
                className="text-[#52b274] no-underline font-medium transition-colors duration-300 hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

