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
import { parseRequestAccessEmail } from '@/lib/validation/requestAccessSchema';
import {
  INVITE_ALREADY_SENT_MESSAGE,
  isInviteAlreadySentError,
} from '@/lib/utils/inviteAlreadySent';
import { loginUser } from '@/lib/auth';
import { useAppStore } from '@/store/useAppStore';
import {
  FOCUS_RING_CLASS,
  FORM_FIELD_CLASS,
  FORM_ERROR_TEXT_CLASS,
  PRIMARY_ACTION_CLASS,
} from '@/lib/constants/formControls';
import { cn } from '@/lib/utils';
import type { RequestInviteDialogProps } from '@/types/components';

// White on the brand green is 2.6:1; these keep text, links and focus readable.
const LINK_CLASS = cn(
  'rounded-sm font-medium text-[#2f6f4a] underline-offset-2 hover:underline dark:text-[#7fdc9c]',
  FOCUS_RING_CLASS
);
const PRIMARY_BUTTON_CLASS = cn('w-full', PRIMARY_ACTION_CLASS, FOCUS_RING_CLASS);

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

    const parsed = parseRequestAccessEmail(email);
    if (!parsed.success) {
      setError(parsed.message);
      return;
    }
    const normalizedEmail = parsed.email;

    try {
      const checkDuplicate = await client.query({
        query: GET_CHECK_DUPLICATE_EMAIL,
        variables: { email: normalizedEmail },
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
        variables: { requestUserAccessInput: { email: normalizedEmail } },
      });

      setSubmitted(true);
      toast.success('Request submitted successfully!');

      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      if (isInviteAlreadySentError(err)) {
        setError(INVITE_ALREADY_SENT_MESSAGE);
        return;
      }
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
              <DialogTitle className="text-center text-base! font-medium! leading-relaxed! text-foreground">
                You need an account to contribute. Viewing is public, but
                posting, voting, and quoting require an invite.
              </DialogTitle>
            </DialogHeader>

            <div className="flex rounded-lg border border-border p-1 gap-1">
              <button
                type="button"
                aria-pressed={panel === 'invite'}
                onClick={() => { setPanel('invite'); setError(''); }}
                className={cn(
                  'min-h-9 flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                  FOCUS_RING_CLASS,
                  panel === 'invite'
                    ? 'bg-[#2f7a4c] text-white'
                    : 'text-foreground/75 hover:bg-muted hover:text-foreground'
                )}
              >
                Request invite
              </button>
              <button
                type="button"
                aria-pressed={panel === 'login'}
                onClick={() => { setPanel('login'); setError(''); }}
                className={cn(
                  'min-h-9 flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                  FOCUS_RING_CLASS,
                  panel === 'login'
                    ? 'bg-[#2f7a4c] text-white'
                    : 'text-foreground/75 hover:bg-muted hover:text-foreground'
                )}
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
                    autoComplete="email"
                    className={FORM_FIELD_CLASS}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInviteSubmit()}
                  />
                </div>

                <div className="text-center py-1">
                  <Link
                    href="/auths/request-access#mission"
                    className={cn(LINK_CLASS, 'text-sm')}
                  >
                    Learn more about our mission
                  </Link>
                </div>

                <Button
                  onClick={handleInviteSubmit}
                  disabled={loading}
                  className={PRIMARY_BUTTON_CLASS}
                >
                  {loading ? 'Submitting...' : 'Request Invite'}
                </Button>
              </>
            ) : (
              <form
                className="flex flex-col space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleLoginSubmit();
                }}
              >
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username or email</Label>
                    <Input
                      id="login-username"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      className={FORM_FIELD_CLASS}
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
                      className={FORM_FIELD_CLASS}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loginLoading} className={PRIMARY_BUTTON_CLASS}>
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
                  <Link href="/auths/forgot-password" className={LINK_CLASS}>
                    Forgot password
                  </Link>
                </p>
              </form>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-center dark:border-red-900/60 dark:bg-red-950/40"
              >
                <p className={cn('m-0 text-sm font-medium', FORM_ERROR_TEXT_CLASS)}>{error}</p>
              </div>
            )}

            {panel === 'invite' && (
              <p className="text-center text-sm text-foreground/75">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setPanel('login'); setError(''); }}
                  className={cn(LINK_CLASS, 'cursor-pointer border-0 bg-transparent p-0')}
                >
                  Log in
                </button>
                {' '}or{' '}
                <Link href={loginPageUrl} className={LINK_CLASS}>
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
