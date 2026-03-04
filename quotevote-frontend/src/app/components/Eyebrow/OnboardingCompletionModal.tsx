"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OnboardingCompletionModalProps } from "@/types/eyebrow";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { SEND_MAGIC_LINK } from "@/graphql/mutations";

export function OnboardingCompletionModal({ email, isOpen, onClose }: OnboardingCompletionModalProps) {
  const router = useRouter();
  const [sendMagicLink] = useMutation(SEND_MAGIC_LINK);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isOnboardLinkSuccess, setIsOnboardLinkSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!email) return;

  const handleOnboardingLinkCreate = async () => {
    try {
      setIsOnboarding(true);
      setErrorMessage(null);
      setIsOnboardLinkSuccess(false);

      await sendMagicLink({ variables: { email } });

      setIsOnboardLinkSuccess(true);
      toast.success("Onboarding link sent!");
      setTimeout(() => {
        onClose();
        setIsOnboardLinkSuccess(false);
      }, 2000);
    } catch (err) {
      const error = err as Error;
      setErrorMessage("There was an error sending the onboarding link");
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsOnboarding(false);
    }
  };

  const handleCreatePassword = () => {
    router.push("/auths/forgot-password?email=" + encodeURIComponent(email));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent
        className="sm:max-w-[425px] [&>button:first-of-type]:hidden"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Your invite is approved!</DialogTitle>
          <DialogDescription>Let&apos;s finish setting up your account.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Button
            onClick={handleOnboardingLinkCreate}
            disabled={isOnboarding || isOnboardLinkSuccess}
            className="w-full"
          >
            {isOnboardLinkSuccess ? "Onboarding link sent" : "Send me a link to finish onboarding"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCreatePassword}
          >
            Create Password now
          </Button>
          {errorMessage && <p className="text-sm text-red-600 mt-2">{errorMessage}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
