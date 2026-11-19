"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@apollo/client/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AccessField } from "@/components/Access/AccessField";
import { UPDATE_USER } from "@/graphql/mutations";
import { replaceGqlError } from "@/lib/utils/replaceGqlError";
import type { ChangePasswordDialogProps } from "@/types/settings";
import type { UpdateUserResponse } from "@/types/test";

/** Same rule Settings used before the profile split. */
export const PASSWORD_MIN_LENGTH = 8;

const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

const EMPTY: ChangePasswordValues = { password: "", confirmPassword: "" };

/**
 * Change Password, under Account in Settings. It has its own form, so changing
 * the password never saves the email or theme, and vice versa. The live API's
 * `updateUser` hashes `password` and leaves every field it isn't sent alone.
 */
export default function ChangePasswordDialog({ userId }: ChangePasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [updateUser, { loading }] = useMutation<UpdateUserResponse>(UPDATE_USER);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  });

  const handleOpenChange = (next: boolean) => {
    if (loading) return;
    setOpen(next);
    if (!next) {
      form.reset(EMPTY);
      setShowPassword(false);
    }
  };

  const onSubmit = async (values: ChangePasswordValues) => {
    try {
      await updateUser({ variables: { user: { _id: userId, password: values.password } } });
      toast.success("Password changed");
      form.reset(EMPTY);
      setShowPassword(false);
      setOpen(false);
    } catch (err) {
      const message = replaceGqlError(
        err instanceof Error ? err.message : "Couldn't change your password"
      );
      form.setError("password", { message }, { shouldFocus: true });
    }
  };

  // The dialog renders in a portal, but React still bubbles its submit to the
  // Settings form around the trigger, so stop it here.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.stopPropagation();
    void form.handleSubmit(onSubmit)(event);
  };

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" className="qv-auth-btn" data-testid="change-password-button" disabled={!userId}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="8" cy="15" r="4" />
            <path d="m10.8 12.2 9.2-9.2M17 6l3 3M15 8l2 2" />
          </svg>
          Change password
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        data-testid="change-password-dialog"
        className="qv-auth qv-inv-popover gap-4 p-6 font-redesign sm:max-w-[380px]"
      >
        <DialogHeader className="text-left">
          <DialogTitle className="qv-auth-display text-[22px]! tracking-[-0.02em]!">Change password</DialogTitle>
          <DialogDescription className="sr-only">
            Choose a new password for signing in to Quote.Vote.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <AccessField
            id="new-password"
            type="password"
            label="New password"
            autoComplete="new-password"
            revealable
            revealed={showPassword}
            onRevealChange={setShowPassword}
            hint={errors.password ? undefined : `At least ${PASSWORD_MIN_LENGTH} characters`}
            error={errors.password?.message}
            {...form.register("password")}
          />
          <AccessField
            id="confirm-new-password"
            type="password"
            label="Confirm new password"
            autoComplete="new-password"
            revealed={showPassword}
            error={errors.confirmPassword?.message}
            {...form.register("confirmPassword")}
          />
          <div className="flex justify-end gap-2.5">
            <button type="button" className="qv-auth-btn" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="qv-auth-btn qv-auth-btn-primary" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Change password
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
