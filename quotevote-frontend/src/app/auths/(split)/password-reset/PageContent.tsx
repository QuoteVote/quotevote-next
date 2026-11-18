"use client";

import type { ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { VERIFY_PASSWORD_RESET_TOKEN } from "@/graphql/queries";
import { UPDATE_USER_PASSWORD } from "@/graphql/mutations";
import { replaceGqlError } from "@/lib/utils/replaceGqlError";
import { AccessSplitLayout } from "@/components/Access/AccessSplitLayout";
import { AccessField } from "@/components/Access/AccessField";
import { AccessFootnote, AccessFormHeader, AccessNotice } from "@/components/Access/AccessParts";
import type { AccessChip } from "@/types/access";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8)
      .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Must have uppercase, lowercase, number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const CHIPS: AccessChip[] = [
  { light: "up", tag: "up", label: "✓", text: "Your reset link is verified" },
  { light: "post", tag: "info", label: "Tip", text: "Use a password you don’t use elsewhere", offset: 36 },
];

const NEW_LINK = { href: "/auths/forgot-password", label: "Request a new link" };

export default function PasswordResetPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const username = searchParams.get("username") ?? "";

  const { data, loading } = useQuery(VERIFY_PASSWORD_RESET_TOKEN, {
    variables: { token },
    skip: !token,
  });
  const [updatePassword] = useMutation(UPDATE_USER_PASSWORD);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const isValidToken = Boolean(
    data && (data as { verifyUserPasswordResetToken?: unknown }).verifyUserPasswordResetToken
  );

  const onSubmit = async (values: FormData) => {
    try {
      await updatePassword({ variables: { token, password: values.newPassword, username } });
      toast.success("Password updated!");
      setTimeout(() => router.push("/auths/login"), 2000);
    } catch (error) {
      toast.error(replaceGqlError(error instanceof Error ? error.message : "Failed to reset password"));
    }
  };

  let content: ReactNode;
  if (!token) {
    content = <AccessNotice title="Invalid Link" message="No reset token found." action={NEW_LINK} />;
  } else if (loading) {
    content = (
      <div className="flex justify-center py-8" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-[var(--auth-primary)]" aria-label="Checking your link" />
      </div>
    );
  } else if (!isValidToken) {
    content = (
      <AccessNotice title="Link Expired" message="This reset link is invalid or expired." action={NEW_LINK} />
    );
  } else {
    content = (
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 lg:gap-[18px]" noValidate>
        <AccessFormHeader title="Set New Password" subtitle="Enter it twice so we know it’s right." />
        <AccessField
          id="newPassword"
          type="password"
          label="New Password"
          autoComplete="new-password"
          revealable
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <AccessField
          id="confirmPassword"
          type="password"
          label="Confirm Password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="qv-auth-btn qv-auth-btn-primary qv-auth-btn-lg w-full"
        >
          {isSubmitting && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
          Update Password
        </button>
        <AccessFootnote text="Back to" link={{ href: "/auths/login", label: "Log in" }} />
      </form>
    );
  }

  return (
    <AccessSplitLayout
      lines={["Almost there.", "Choose a new password,"]}
      accent="then pick up where you left off."
      chips={CHIPS}
      prompt="Need help?"
      action={NEW_LINK}
    >
      {content}
    </AccessSplitLayout>
  );
}
