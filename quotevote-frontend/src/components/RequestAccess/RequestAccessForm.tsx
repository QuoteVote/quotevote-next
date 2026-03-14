'use client';

/**
 * RequestAccessForm Component
 *
 * Form component for requesting platform access via email invitation.
 */

import { useState } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { Mail, AlertCircle } from 'lucide-react';
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
  const [requestUserAccess, { loading }] = useMutation(REQUEST_USER_ACCESS_MUTATION);

  const onSubmit = async () => {
    setErrorMessage('');

    const validationResult = requestAccessEmailSchema.safeParse({ email: userDetails });
    if (!validationResult.success) {
      setErrorMessage(
        validationResult.error.issues[0]?.message || 'Please enter a valid email address'
      );
      return;
    }

    try {
      const { data } = await client.query({
        query: GET_CHECK_DUPLICATE_EMAIL,
        variables: { email: userDetails },
        fetchPolicy: 'network-only',
      });

      const hasDuplicatedEmail =
        ((data as { checkDuplicateEmail?: unknown[] })?.checkDuplicateEmail?.length || 0) > 0;

      if (hasDuplicatedEmail) {
        setErrorMessage('This email address has already been used to request an invite.');
        return;
      }

      await requestUserAccess({ variables: { requestUserAccessInput: { email: userDetails } } });
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
    <div className="w-full space-y-6">
      {/* Email input */}
      <div className="space-y-2.5">
        <Label htmlFor="request-email" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.70)' }}>
          Email address
        </Label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Mail
              className="h-4 w-4 transition-colors duration-200 text-white/30 group-focus-within:text-[#52b274]"
              aria-hidden
            />
          </div>
          <Input
            id="request-email"
            type="email"
            placeholder="you@example.com"
            value={userDetails}
            onChange={(e) => setUserDetails(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
            disabled={loading}
            className="pl-11 h-11 border border-white/10 bg-white/5 hover:bg-white/8 text-white placeholder:text-white/30 rounded-xl focus:ring-2 focus:ring-[#52b274]/40 focus:border-[#52b274] focus:outline-none transition-all duration-200"
          />
        </div>
      </div>

      {/* Error */}
      {errorMessage && (
        <div
          className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" aria-hidden />
          <p className="text-red-300">{errorMessage}</p>
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={onSubmit}
        disabled={loading}
        className="w-full h-11 text-sm font-semibold rounded-xl border-0 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
        style={{
          background: 'linear-gradient(135deg, #52b274 0%, #3a9058 100%)',
          boxShadow: '0 4px 20px rgba(82,178,116,0.30)',
        }}
      >
        {loading ? 'Sending…' : 'Request Invite'}
      </Button>
    </div>
  );
}
