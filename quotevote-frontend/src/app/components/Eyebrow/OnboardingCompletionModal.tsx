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
import { useState } from "react";

const OnboardingCompletionModal = ({ email, isOpen, onClose }: OnboardingCompletionModalProps) => {
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isOnboardLinkSuccess, setIsOnboardLinkSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!email) return;

  const handleOnboardingLinkCreate = async () => {
    try {
      setIsOnboarding(true);
      setErrorMessage(null);
      setIsOnboardLinkSuccess(false);

      // Add correct endpoint here when backend is complete
      await fetch("");

      // If successful, show feedback and close modal
      setIsOnboardLinkSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch {
      setErrorMessage("There was an error sending the onboarding link");
    } finally {
      setIsOnboarding(false);
    }
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
          <DialogDescription>Let’s finish setting up your account.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Button
            onClick={handleOnboardingLinkCreate}
            disabled={isOnboarding || isOnboardLinkSuccess}
            className="w-full"
          >
            {isOnboardLinkSuccess ? "Onboarding link sent" : "Send me a link to finish onboarding"}
          </Button>
          <Button variant="outline" className="w-full">
            Create Password now
          </Button>
          {errorMessage && <p className="text-sm text-red-600 mt-2">{errorMessage}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingCompletionModal;
