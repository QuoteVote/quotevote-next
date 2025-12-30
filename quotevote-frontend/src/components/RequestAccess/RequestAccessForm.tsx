'use client';

/**
 * RequestAccessForm Component
 * 
 * Form component for requesting platform access via email invitation.
 * Migrated from Material UI to shadcn/ui components.
 */

import { useState } from 'react';
// @ts-expect-error - Apollo Client v4.0.9 has type resolution issues with useMutation and useApolloClient exports
import { useApolloClient, useMutation } from '@apollo/client';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { REQUEST_USER_ACCESS_MUTATION } from '@/graphql/mutations';
import { GET_CHECK_DUPLICATE_EMAIL } from '@/graphql/queries';
import { requestAccessEmailSchema } from '@/lib/validation/requestAccessSchema';
import type { RequestAccessFormProps } from '@/types/components';
import { PersonalForm } from './PersonalForm';

export function RequestAccessForm({ onSuccess }: RequestAccessFormProps) {
  const [userDetails, setUserDetails] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [requestInviteSuccessful, setRequestInviteSuccessful] = useState(false);

  const client = useApolloClient();
  const [requestUserAccess, { loading }] = useMutation(
    REQUEST_USER_ACCESS_MUTATION
  );

  const onSubmit = async () => {
    setErrorMessage('');

    // Validate email using Zod schema
    const validationResult = requestAccessEmailSchema.safeParse({
      email: userDetails,
    });

    if (!validationResult.success) {
      setErrorMessage(validationResult.error.issues[0]?.message || 'Please enter a valid email address');
      return;
    }

    try {
      // Check for duplicate email
      const { data } = await client.query({
        query: GET_CHECK_DUPLICATE_EMAIL,
        variables: { email: userDetails },
        fetchPolicy: 'network-only',
      });

      const hasDuplicatedEmail = data?.checkDuplicateEmail?.length > 0;
      if (hasDuplicatedEmail) {
        setErrorMessage(
          'This email address has already been used to request an invite.'
        );
        return;
      }

      // Submit request
      const requestUserAccessInput = { email: userDetails };
      await requestUserAccess({ variables: { requestUserAccessInput } });
      setRequestInviteSuccessful(true);
      toast.success('Request submitted successfully!');
      if (onSuccess) onSuccess();
    } catch (err) {
      const error = err as Error;
      if (error.message.includes('email: Path `email` is required.')) {
        setErrorMessage('Email is required');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again later.');
        toast.error('Failed to submit request');
      }
    }
  };

  if (requestInviteSuccessful) {
    return <PersonalForm requestInviteSuccessful={requestInviteSuccessful} />;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-4 p-4">
      <div className="w-full max-w-md">
        <p className="text-center text-gray-800 mb-4 text-sm md:text-base leading-relaxed font-medium">
          You need an account to contribute. Viewing is public, but posting,
          voting, and quoting require an invite.
        </p>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 my-3 border-2 border-gray-200 transition-all duration-300 focus-within:border-[#52b274] focus-within:shadow-[0_0_0_4px_rgba(82,178,116,0.1)] focus-within:bg-gradient-to-br focus-within:from-white focus-within:to-gray-50">
          <Label htmlFor="email" className="sr-only">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter Your Email Address"
            value={userDetails}
            onChange={(e) => setUserDetails(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onSubmit();
              }
            }}
            className="bg-transparent border-none outline-none w-full text-base md:text-lg text-gray-800 font-medium p-0 placeholder:text-gray-500 placeholder:font-normal"
          />
        </div>

        <div className="text-center mt-4 mb-2">
          <Link
            href="/auth/request-access#mission"
            className="text-[#52b274] no-underline text-sm md:text-base font-medium transition-colors duration-300 hover:text-[#4a9f63] hover:underline"
          >
            Learn more about our mission here
          </Link>
        </div>

        <Button
          onClick={onSubmit}
          disabled={loading}
          className="w-full mt-6 py-3.5 px-6 text-base md:text-lg font-semibold bg-[#52b274] text-white rounded-[10px] shadow-[0_4px_12px_rgba(82,178,116,0.3)] transition-all duration-300 border-none cursor-pointer hover:bg-[#4a9f63] hover:shadow-[0_6px_16px_rgba(82,178,116,0.4)] hover:-translate-y-0.5 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0"
        >
          {loading ? 'Sending...' : 'Request Invite'}
        </Button>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4 text-center">
            <p className="text-red-700 text-sm md:text-base font-medium m-0">
              {errorMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

