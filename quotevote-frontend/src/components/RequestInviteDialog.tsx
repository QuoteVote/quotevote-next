'use client';

/**
 * RequestInviteDialog Component
 *
 * Auth gate modal for guests: request invite, login with password, or learn more.
 * Viewing is public; participation requires an account.
 */

import { useState, useEffect, useRef } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
import { loginUser } from '@/lib/auth';
import { useAppStore } from '@/store/useAppStore';
import type { RequestInviteDialogProps } from '@/types/components';

type PanelView = 'invite' | 'login';

export function RequestInviteDialog({ open, onClose, view = 'invite' }: RequestInviteDialogProps) {
  const [panel, setPanel] = useState<PanelView>(view);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setUserData = useAppStore((s) => s.setUserData);

  const client = useApolloClient();
  const [requestUserAccess, { loading }] = useMutation(
    REQUEST_USER_ACCESS_MUTATION
  );

  useEffect(() => {
    if (open) {
      setPanel(view);
    }
  }, [open, view]);

  const handleInviteSubmit = async () => {
    setError('');

    const validationResult = requestAccessEmailSchema.safeParse({ email });

    if (!validationResult.success) {
      setError(
        validationResult.error.issues[0]?.message || 'Please enter a valid email address'
      );
      return;
    }

    try {
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

      await requestUserAccess({
        variables: { requestUserAccessInput: { email } },
      });

      setSubmitted(true);
      toast.success('Request submitted successfully!');

      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      const submitError = err as Error;
      setError('An unexpected error occurred. Please try again later.');
      toast.error('Failed to submit request');
      console.error(submitError);
    }
  };

  const handleLoginSubmit = async () => {
    setError('');
    if (!loginUsername.trim() || !loginPassword) {
      setError('Username and password are required.');
      return;
    }

    setLoginLoading(true);
    try {
      const result = await loginUser(loginUsername.trim(), loginPassword);
      if (result.success && result.data) {
        setUserData(result.data.user as Record<string, unknown>);
        toast.success('Welcome back!');
        handleClose();
        return;
      }
      setError(result.error || 'Login failed. Please try again.');
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setEmail('');
    setError('');
    setSubmitted(false);
    setLoginUsername('');
    setLoginPassword('');
    setPanel('invite');
    onClose();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
  const loginPageUrl = `/auths/login?callbackUrl=${encodeURIComponent(currentPath)}`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="flex flex-col items-center space-y-4 py-4">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-semibold text-foreground">
                Thank you for joining us
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="text-center text-muted-foreground text-sm leading-relaxed">
              When an account becomes available, an invite will be sent to the
              email provided.
            </DialogDescription>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <DialogHeader>
              <DialogTitle className="text-center text-base font-medium text-foreground leading-relaxed">
                You need an account to contribute. Viewing is public, but
                posting, voting, and quoting require an invite.
              </DialogTitle>
            </DialogHeader>

            <div className="flex rounded-lg border border-border p-1 gap-1">
              <button
                type="button"
                onClick={() => { setPanel('invite'); setError(''); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  panel === 'invite'
                    ? 'bg-[#52b274] text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Request invite
              </button>
              <button
                type="button"
                onClick={() => { setPanel('login'); setError(''); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  panel === 'login'
                    ? 'bg-[#52b274] text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Log in
              </button>
            </div>

            {panel === 'invite' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="invite-email" className="sr-only">
                    Email Address
                  </Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInviteSubmit()}
                  />
                </div>

                <div className="text-center py-1">
                  <Link
                    href="/auths/request-access#mission"
                    className="text-[#52b274] no-underline text-sm font-medium hover:underline"
                  >
                    Learn more about our mission
                  </Link>
                </div>

                <Button
                  onClick={handleInviteSubmit}
                  disabled={loading}
                  className="w-full bg-[#52b274] text-white hover:bg-[#4a9e63]"
                >
                  {loading ? 'Submitting...' : 'Request Invite'}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username or email</Label>
                    <Input
                      id="login-username"
                      autoComplete="username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLoginSubmit()}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleLoginSubmit}
                  disabled={loginLoading}
                  className="w-full bg-[#52b274] text-white hover:bg-[#4a9e63]"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Need a password reset or magic link?{' '}
                  <Link href="/auths/forgot-password" className="text-[#52b274] font-medium hover:underline">
                    Forgot password
                  </Link>
                </p>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <p className="text-red-800 text-sm font-medium m-0">{error}</p>
              </div>
            )}

            {panel === 'invite' && (
              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setPanel('login'); setError(''); }}
                  className="text-[#52b274] font-medium hover:underline bg-transparent border-0 cursor-pointer p-0"
                >
                  Log in
                </button>
                {' '}or{' '}
                <Link href={loginPageUrl} className="text-[#52b274] font-medium hover:underline">
                  open full login page
                </Link>
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
