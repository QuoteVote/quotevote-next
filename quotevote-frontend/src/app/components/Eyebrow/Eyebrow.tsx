"use client";

import { useForm } from "react-hook-form";
import { useAppStore } from "@/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { eyebrowSchema } from "@/lib/validation/eyebrowSchema";
import { EyebrowFormData } from "@/types/eyebrow";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import LoginOptionsModal from "@/app/components/Eyebrow/LoginOptionsModal";
import OnboardingCompletionModal from "@/app/components/Eyebrow/OnboardingCompletionModal";

export function Eyebrow() {
  const user = useAppStore((state) => state.user.data);
  const loggedIn = !!user?.id;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | undefined>();

  const [isLoginOptionsModalOpen, setIsLoginOptionsModalOpen] = useState<boolean>(false);
  const [isOnboardingCompletionModalOpen, setIsOnboardingCompletionModalOpen] =
    useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    clearErrors,
    setValue,
    watch,
  } = useForm<EyebrowFormData>({
    resolver: zodResolver(eyebrowSchema),
    defaultValues: {
      email: "",
    },
  });

  // We don't render component if user is authenticated
  if (loggedIn) {
    return;
  }

  const handleContinue = async (data: EyebrowFormData) => {
    try {
      clearErrors();
      setIsLoading(true);

      const email = data?.email;

      const res = await fetch(`/auth/check-email?email=${email}`);
      const result = await res.json();

      switch (result.status) {
        case "registered":
          openLoginOptionsModal();
          break;

        case "not_requested":
          await handleNewInviteRequest(email);
          setFeedback("Your request has been received! You’ll be notified once approved.");
          break;

        case "requested_pending":
          setFeedback("Your invite request is still waiting for approval.");
          break;

        case "approved_no_password":
          openOnboardingCompletionModal();
          break;
      }
    } catch {
      setFeedback("An error has occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewInviteRequest = async (email: string) => {
    // Add correct endpoint here when backend is complete
    await fetch("", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  const handleRemoveErrors = () => {
    clearErrors();

    // Reset email input
    if (feedback) {
      setValue("email", "");
      setFeedback(undefined);
    }
  };

  const openLoginOptionsModal = () => {
    setIsLoginOptionsModalOpen(true);
  };

  const closeLoginOptionsModal = () => {
    setIsLoginOptionsModalOpen(false);
  };

  const openOnboardingCompletionModal = () => {
    setIsOnboardingCompletionModalOpen(true);
  };

  const closeOnboardingCompletionModal = () => {
    setIsOnboardingCompletionModalOpen(false);
  };

  return (
    <>
      <LoginOptionsModal
        isOpen={isLoginOptionsModalOpen}
        onClose={closeLoginOptionsModal}
        email={watch("email")}
      />
      <OnboardingCompletionModal
        isOpen={isOnboardingCompletionModalOpen}
        onClose={closeOnboardingCompletionModal}
        email={watch("email")}
      />
      <div className="bg-white z-40 shadow-sm">
        <div className="mx-auto px-6 py-3 w-full flex flex-col sm:flex-row items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5 grow w-full">
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="w-full"
              onFocus={handleRemoveErrors}
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <div className="min-h-4 text-[13px] text-red-500 hidden sm:block">
                <span>{errors.email.message}</span>
              </div>
            )}
            {feedback && (
              <div className="min-h-4 text-[13px] text-primary hidden sm:block">
                <span>{feedback}</span>
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit(handleContinue)}
            disabled={!isValid || isLoading}
            type="submit"
            className="mx-auto w-full sm:w-fit"
          >
            Continue
          </Button>

          {errors.email && (
            <div className="min-h-4 text-[13px] text-red-500 block sm:hidden">
              <span>{errors.email.message}</span>
            </div>
          )}
          {feedback && (
            <div className="min-h-4 text-[13px] text-primary block sm:hidden">
              <span>{feedback}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
