"use client";

import { useForm } from "react-hook-form";
import { useAppStore } from "@/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { eyebrowSchema } from "@/lib/validation/eyebrowSchema";
import { EyebrowFormData } from "@/types/eyebrow";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import LoginOptionsModal from "./LoginOptionsModal";
import OnboardingCompletionModal from "./OnboardingCompletionModal";

export function Eyebrow() {
  const user = useAppStore((state) => state.user.data);
  const loggedIn = !!user?._id;

  // We don't render component if user is authenticated
  if (loggedIn) {
    return;
  }

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
  } = useForm<EyebrowFormData>({
    resolver: zodResolver(eyebrowSchema),
    defaultValues: {
      email: "",
    },
  });

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
          setFeedback("Your request has been received! You’ll be notified once approved.");
          break;

        case "requested_pending":
          setFeedback("Your invite request is still waiting for approval.");
          break;

        case "approved_no_password":
          openOnboardingCompletionModal();
          break;

        default:
          console.log("Unknown");
          break;
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
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
      <LoginOptionsModal isOpen={isLoginOptionsModalOpen} onClose={closeLoginOptionsModal} />
      <OnboardingCompletionModal
        isOpen={isOnboardingCompletionModalOpen}
        onClose={closeOnboardingCompletionModal}
      />
      <div className="bg-white z-40 shadow-sm">
        <div className="mx-auto px-6 py-3 w-full flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5 grow">
            <Input
              id="eyebrow-email"
              type="email"
              placeholder="Enter your email"
              className="w-full"
              onFocus={handleRemoveErrors}
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <div className="min-h-4 text-[13px] text-red-500">
                <span>{errors.email.message}</span>
              </div>
            )}
            {feedback && (
              <div className="min-h-4 text-[13px] text-primary">
                <span>{feedback}</span>
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit(handleContinue)}
            disabled={!isValid || isLoading}
            type="submit"
          >
            Continue
          </Button>
        </div>
      </div>
    </>
  );
}
