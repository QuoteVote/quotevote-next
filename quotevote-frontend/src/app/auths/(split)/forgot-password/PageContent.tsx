"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SEND_PASSWORD_RESET_EMAIL } from "@/graphql/mutations";
import { replaceGqlError } from "@/lib/utils/replaceGqlError";
import { AccessSplitLayout } from "@/components/Access/AccessSplitLayout";
import { AccessField } from "@/components/Access/AccessField";
import { AccessFootnote, AccessFormHeader, AccessNotice } from "@/components/Access/AccessParts";
import type { AccessChip } from "@/types/access";

const schema = z.object({ email: z.string().email("Invalid email address") });
type FormData = z.infer<typeof schema>;

const CHIPS: AccessChip[] = [
  { light: "post", tag: "info", label: "1", text: "Enter the email on your account" },
  { light: "up", tag: "up", label: "2", text: "Open the link we email you", offset: 36 },
  { light: "comment", tag: "comment", label: "3", text: "Set a new password and log in", offset: 12 },
];

export default function ForgotPasswordPageContent() {
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendEmail] = useMutation(SEND_PASSWORD_RESET_EMAIL);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    setSubmitting(true);
    try {
      await sendEmail({ variables: { email: values.email } });
      setSentEmail(values.email);
    } catch (error) {
      toast.error(replaceGqlError(error instanceof Error ? error.message : "Failed to send reset email"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AccessSplitLayout
      lines={["Locked out?", "We’ll get you back"]}
      accent="to the conversation."
      chips={CHIPS}
      prompt="Remembered it?"
      action={{ href: "/auths/login", label: "Log in" }}
    >
      {sentEmail ? (
        <AccessNotice
          title="Email Sent"
          message={`If ${sentEmail} has an account, we’ve sent it a link to set a new password. Check your inbox and spam folder.`}
          action={{ href: "/auths/login", label: "Go to Login" }}
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 lg:gap-[18px]" noValidate>
          <AccessFormHeader
            title="Forgot password?"
            subtitle="Enter your email and we’ll send you a link to set a new one."
          />
          <AccessField
            id="email"
            type="email"
            label="Email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <button
            type="submit"
            disabled={submitting}
            className="qv-auth-btn qv-auth-btn-primary qv-auth-btn-lg w-full"
          >
            {submitting && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
            Send
          </button>
          <AccessFootnote
            text="No account?"
            link={{ href: "/auths/request-access", label: "Request Access" }}
          />
        </form>
      )}
    </AccessSplitLayout>
  );
}
