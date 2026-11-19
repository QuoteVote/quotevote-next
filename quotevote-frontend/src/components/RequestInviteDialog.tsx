"use client";

/**
 * RequestInviteDialog Component
 *
 * Auth gate modal for guests: request invite, login with password, or learn more.
 * Viewing is public; participation requires an account.
 */

import { useState, useEffect, useRef } from "react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { REQUEST_USER_ACCESS_MUTATION } from "@/graphql/mutations";
import { GET_CHECK_DUPLICATE_EMAIL } from "@/graphql/queries";
import { parseRequestAccessEmail } from "@/lib/validation/requestAccessSchema";
import {
  INVITE_ALREADY_SENT_MESSAGE,
  isInviteAlreadySentError,
} from "@/lib/utils/inviteAlreadySent";
import { loginUser } from "@/lib/auth";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { AccessField } from "@/components/Access/AccessField";
import type { RequestInviteDialogProps } from "@/types/components";

const TAB_CLASS =
  "h-[38px] flex-1 cursor-pointer rounded-[10px] border-0 bg-transparent px-3.5 text-[13.5px] font-bold text-[var(--auth-ink-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--auth-focus-line)] [.neo-brutalism_&]:rounded-[4px]";
const TAB_ON_CLASS =
  "bg-[var(--auth-surface)] text-[var(--auth-ink)] shadow-[0_1px_2px_rgba(15,23,42,0.1)] [.neo-brutalism_&]:border-2 [.neo-brutalism_&]:border-[var(--auth-line)]";

type PanelView = "invite" | "login";

export function RequestInviteDialog({ open, onClose, view = "invite" }: RequestInviteDialogProps) {
  const [panel, setPanel] = useState<PanelView>(view);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setUserData = useAppStore((s) => s.setUserData);

  const client = useApolloClient();
  const [requestUserAccess, { loading }] = useMutation(REQUEST_USER_ACCESS_MUTATION);

  useEffect(() => {
    if (open) {
      setPanel(view);
    }
  }, [open, view]);

  const handleInviteSubmit = async () => {
    setError("");

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
        fetchPolicy: "network-only",
      });

      if (
        checkDuplicate &&
        Array.isArray(
          (checkDuplicate.data as { checkDuplicateEmail?: unknown[] })?.checkDuplicateEmail
        ) &&
        ((checkDuplicate.data as { checkDuplicateEmail?: unknown[] })?.checkDuplicateEmail
          ?.length || 0) > 0
      ) {
        setError("This email address has already been used to request an invite.");
        return;
      }

      await requestUserAccess({
        variables: { requestUserAccessInput: { email: normalizedEmail } },
      });

      setSubmittedEmail(normalizedEmail);
      setSubmitted(true);
      toast.success("Request submitted successfully!");

      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      if (isInviteAlreadySentError(err)) {
        setError(INVITE_ALREADY_SENT_MESSAGE);
        return;
      }
      const submitError = err as Error;
      setError("An unexpected error occurred. Please try again later.");
      toast.error("Failed to submit request");
      console.error(submitError);
    }
  };

  const handleLoginSubmit = async () => {
    setError("");
    if (!loginUsername.trim() || !loginPassword) {
      setError("Username and password are required.");
      return;
    }

    setLoginLoading(true);
    try {
      const result = await loginUser(loginUsername.trim(), loginPassword);
      if (result.success && result.data) {
        setUserData(result.data.user as Record<string, unknown>);
        toast.success("Welcome back!");
        handleClose();
        return;
      }
      setError(result.error || "Login failed. Please try again.");
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setEmail("");
    setError("");
    setSubmitted(false);
    setSubmittedEmail("");
    setLoginUsername("");
    setLoginPassword("");
    setPanel("invite");
    onClose();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
  const loginPageUrl = `/auths/login?callbackUrl=${encodeURIComponent(currentPath)}`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        className={cn(
          "qv-auth gap-0 rounded-[24px] border-0 bg-[var(--auth-surface)] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)] sm:max-w-[584px]",
          "[.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2 [.neo-brutalism_&]:border-[var(--auth-line)] [.neo-brutalism_&]:shadow-[6px_6px_0_var(--auth-line)]",
          submitted ? "p-7 sm:max-w-[436px]" : "p-6 sm:p-8"
        )}
      >
        {submitted ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <span
              className="flex size-16 items-center justify-center rounded-full bg-[#e5f2ea] shadow-[0_0_0_8px_rgba(82,178,116,0.12),0_0_30px_-4px_rgba(82,178,116,0.7)]"
              aria-hidden="true"
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1F7A4D"
                strokeWidth="2.4"
              >
                <path d="m5 12 5 5 9-10" />
              </svg>
            </span>
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="qv-auth-display text-[26px]! leading-[1.08]! font-extrabold!">
                Thank you for joining us
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="qv-auth-muted m-0 text-sm! leading-[1.55]!">
              We’ll email {submittedEmail || "you"} when your request is approved.
            </DialogDescription>
          </div>
        ) : (
          <div className="flex flex-col gap-[18px]">
            <span
              className="flex size-[52px] items-center justify-center rounded-2xl bg-[#e5f2ea] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2 [.neo-brutalism_&]:border-[var(--auth-line)]"
              aria-hidden="true"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1F7A4D"
                strokeWidth="2"
              >
                <path d="M7 10v11H4V10zM7 10l4-7a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 17.7 21H7" />
              </svg>
            </span>
            <DialogHeader className="gap-[18px] text-left">
              <DialogTitle className="qv-auth-display pr-8 text-[26px]! leading-[1.08]! font-extrabold! sm:text-[32px]!">
                You need an account to contribute
              </DialogTitle>
              <DialogDescription className="qv-auth-muted m-0 text-[15px]! leading-[1.55]!">
                Voting, quoting and commenting are for members. Quote.Vote is invite-only while it
                grows.
              </DialogDescription>
            </DialogHeader>

            <div className="flex w-full gap-1 rounded-[14px] bg-[var(--auth-locked-bg)] p-1 [.neo-brutalism_&]:rounded-[4px]">
              <button
                type="button"
                aria-pressed={panel === "invite"}
                onClick={() => {
                  setPanel("invite");
                  setError("");
                }}
                className={cn(TAB_CLASS, panel === "invite" && TAB_ON_CLASS)}
              >
                Request invite
              </button>
              <button
                type="button"
                aria-pressed={panel === "login"}
                onClick={() => {
                  setPanel("login");
                  setError("");
                }}
                className={cn(TAB_CLASS, panel === "login" && TAB_ON_CLASS)}
              >
                Log in
              </button>
            </div>

            {panel === "invite" ? (
              <form
                className="flex flex-col gap-[18px]"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleInviteSubmit();
                }}
              >
                <AccessField
                  id="invite-email"
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email address"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="qv-auth-btn qv-auth-btn-primary qv-auth-btn-lg w-full"
                >
                  {loading ? "Submitting..." : "Request Invite"}
                </button>
                <Link href="/about" className="qv-auth-link self-center text-sm font-semibold">
                  Learn more about our mission
                </Link>
              </form>
            ) : (
              <form
                className="flex flex-col gap-[18px]"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleLoginSubmit();
                }}
              >
                <AccessField
                  id="login-username"
                  label="Username or email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                />
                <AccessField
                  id="login-password"
                  type="password"
                  label="Password"
                  labelLink={{ href: "/auths/forgot-password", label: "Forgot password?" }}
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="qv-auth-btn qv-auth-btn-primary qv-auth-btn-lg w-full"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
                <Link
                  href={loginPageUrl}
                  className="qv-auth-link self-center text-sm font-semibold"
                >
                  Or open the full login page
                </Link>
              </form>
            )}

            {error && (
              <p role="alert" className="qv-auth-err -mt-2 text-center text-sm!">
                {error}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
