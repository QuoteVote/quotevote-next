"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { COMPLETE_SIGNUP } from "@/graphql/mutations";
import { VERIFY_INVITE_SIGNUP_TOKEN } from "@/graphql/queries";
import { CURRENT_TERMS_VERSION } from "@/lib/constants/terms";
import type { CompleteSignupData, VerifyInviteSignupTokenData } from "@/types/signup";
import { Skeleton } from "@/components/ui/skeleton";
import { AccessSplitLayout } from "@/components/Access/AccessSplitLayout";
import { AccessField } from "@/components/Access/AccessField";
import { AccessConsent, AccessFootnote, AccessFormHeader } from "@/components/Access/AccessParts";
import { NoticePage } from "@/components/Public/Notice";
import type { AccessChip } from "@/types/access";

const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, "Min 3 chars")
      .max(20)
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscores"),
    email: z.string().email("Invalid email"),
    password: z
      .string()
      .min(8, "Min 8 chars")
      .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Must contain uppercase, lowercase, and number"),
    confirmPassword: z.string(),
    tos: z.boolean().refine((accepted) => accepted, {
      message: "You must agree to the Terms of Service",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

const CHIPS: AccessChip[] = [
  { light: "post", tag: "info", label: "Post", text: "Share a quote and its source" },
  { light: "up", tag: "up", label: "↑ Agree", text: "Vote on the exact words", offset: 36 },
  {
    light: "comment",
    tag: "comment",
    label: "Comment",
    text: "Talk it through in the discussion",
    offset: 12,
  },
];

export default function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [submitting, setSubmitting] = useState(false);

  // Verify the invite token
  const {
    data: tokenData,
    loading: tokenLoading,
    error: tokenError,
  } = useQuery<VerifyInviteSignupTokenData>(VERIFY_INVITE_SIGNUP_TOKEN, {
    variables: { token },
    skip: !token,
  });

  const verifiedUser = tokenData?.verifyInviteSignupToken;
  // The address the invite was approved for. It stays on the account (#592).
  const invitedEmail =
    token && typeof verifiedUser?.email === "string" && verifiedUser.email
      ? verifiedUser.email
      : undefined;

  const [completeSignup] = useMutation<CompleteSignupData>(COMPLETE_SIGNUP);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { tos: false },
  });

  useEffect(() => {
    if (invitedEmail) setValue("email", invitedEmail);
  }, [invitedEmail, setValue]);

  // Membership is invitation-only: accounts are only created by finishing an approved invite.
  const onSubmit = async (values: SignupFormData) => {
    if (!token || !verifiedUser) return;
    setSubmitting(true);
    try {
      // The invite token is not a session, so the user signs in afterwards. The email is
      // left out so the account keeps the invited address.
      const result = await completeSignup({
        variables: {
          token,
          username: values.username,
          password: values.password,
          acceptedTermsVersion: CURRENT_TERMS_VERSION,
        },
      });
      if (result.data?.completeSignup) {
        toast.success("Account created! Please sign in.");
        router.push("/auths/login");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  const loading = Boolean(token) && tokenLoading;
  const invalid = !token || (!tokenLoading && (!verifiedUser || Boolean(tokenError)));

  if (invalid) return <NoticePage kind="invalidInvite" />;

  return (
    <AccessSplitLayout
      lines={["You’re invited.", "Join the conversation,"]}
      accent="not the noise."
      chips={CHIPS}
      prompt="Already a member?"
      action={{ href: "/auths/login", label: "Log in" }}
      formWidth={440}
    >
      {loading ? (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Checking your invite">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          data-testid="signup-form"
          noValidate
        >
          <AccessFormHeader eyebrow="Your invite is ready" title="Create Account" />
          <AccessField
            id="username"
            label="Username"
            autoComplete="username"
            data-testid="signup-username-input"
            error={errors.username?.message}
            {...register("username")}
          />
          <AccessField
            id="email"
            type="email"
            label="Email"
            locked={Boolean(invitedEmail)}
            hint={invitedEmail ? "This invite is for this address." : undefined}
            data-testid="signup-email-input"
            error={errors.email?.message}
            {...register("email")}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AccessField
              id="password"
              type="password"
              label="Password"
              autoComplete="new-password"
              data-testid="signup-password-input"
              error={errors.password?.message}
              {...register("password")}
            />
            <AccessField
              id="confirmPassword"
              type="password"
              label="Confirm Password"
              autoComplete="new-password"
              data-testid="signup-confirm-password-input"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </div>
          <AccessConsent
            id="signup-tos"
            document="terms"
            data-testid="signup-tos-checkbox"
            error={errors.tos?.message}
            {...register("tos")}
          />
          <button
            type="submit"
            disabled={submitting}
            className="qv-auth-btn qv-auth-btn-primary qv-auth-btn-lg w-full"
            data-testid="signup-submit-button"
          >
            {submitting && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
            Create Account
          </button>
          <AccessFootnote
            text="Already have an account?"
            link={{ href: "/auths/login", label: "Sign in" }}
          />
        </form>
      )}
    </AccessSplitLayout>
  );
}
