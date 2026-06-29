"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoginOptionsModalProps } from "@/types/eyebrow";

const LoginOptionsModal = ({ email, isOpen, onClose }: LoginOptionsModalProps) => {
  if (!email) return;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent
        className="sm:max-w-[425px] [&>button:first-of-type]:hidden"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
       <DialogHeader>
          <DialogTitle data-testid="registered-user-message">We recognize this email.</DialogTitle>
          <DialogDescription>Choose how you&apos;d like to log in</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Button data-testid="magic-link-login-option" className="w-full">
            Send me a login link
          </Button>
          <Button data-testid="password-login-option" variant="outline" className="w-full">
            Login with password
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginOptionsModal;
