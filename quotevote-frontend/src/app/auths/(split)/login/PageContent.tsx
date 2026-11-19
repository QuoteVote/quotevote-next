"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { loginUser } from "@/lib/auth";
import { useAppStore } from "@/store/useAppStore";
import { AccessSplitLayout } from "@/components/Access/AccessSplitLayout";
import { AccessField } from "@/components/Access/AccessField";
import { AccessConsent, AccessFootnote, AccessFormHeader } from "@/components/Access/AccessParts";
import type { AccessChip } from "@/types/access";

const loginSchema = z.object({
  email: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});
type LoginFormData = z.infer<typeof loginSchema>;

const CHIPS: AccessChip[] = [
  { light: "up", tag: "up", label: "↑ Agree", text: "“safer crossings near the school”" },
  { light: "quote", tag: "quote", label: "“ Quote", text: "“homes where the transit is”", offset: 36 },
  { light: "comment", tag: "comment", label: "Comment", text: "Write the fund into the ordinance.", offset: 12 },
];

export default function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || searchParams.get("redirect") || "/";
  const setUserData = useAppStore((s) => s.setUserData);
  const [submitting, setSubmitting] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [cocAccepted, setCocAccepted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const isDisabled = submitting || !tosAccepted || !cocAccepted;

  const onSubmit = async (values: LoginFormData) => {
    setSubmitting(true);
    try {
      const result = await loginUser(values.email, values.password);
      if (result.success && result.data) {
        setUserData(result.data.user as Record<string, unknown>);
        router.push(callbackUrl.startsWith("/") ? callbackUrl : "/");
      } else {
        toast.error(result.error || "Login failed");
      }
    } catch {
      toast.error("Connection failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AccessSplitLayout
      lines={["Read closely.", "Vote on the words,"]}
      accent="not the noise."
      chips={CHIPS}
      prompt="New here?"
      action={{ href: "/auths/request-access", label: "Request Invite" }}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        data-testid="login-form"
        className="flex flex-col gap-4 lg:gap-[18px]"
        noValidate
      >
        <AccessFormHeader
          title="Welcome back"
          subtitle="Log in with your email or username."
          subtitleDesktopOnly
        />
        <AccessField
          id="email"
          label="Email or username"
          autoComplete="username"
          data-testid="login-identifier-input"
          error={errors.email?.message}
          {...register("email")}
        />
        <AccessField
          id="password"
          type="password"
          label="Password"
          labelLink={{ href: "/auths/forgot-password", label: "Forgot password?" }}
          autoComplete="current-password"
          revealable
          data-testid="login-password-input"
          error={errors.password?.message}
          {...register("password")}
        />
        <div>
          <AccessConsent
            id="tos"
            document="terms"
            data-testid="login-tos-checkbox"
            checked={tosAccepted}
            onChange={(event) => setTosAccepted(event.target.checked)}
          />
          <AccessConsent
            id="coc"
            document="conduct"
            data-testid="login-coc-checkbox"
            checked={cocAccepted}
            onChange={(event) => setCocAccepted(event.target.checked)}
          />
        </div>
        <button
          type="submit"
          data-testid="login-submit-button"
          disabled={isDisabled}
          className="qv-auth-btn qv-auth-btn-primary qv-auth-btn-lg w-full"
        >
          {submitting && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
          Log in
        </button>
        <AccessFootnote
          text="No account?"
          link={{ href: "/auths/request-access", label: "Request an invite" }}
        />
      </form>
    </AccessSplitLayout>
  );
}
