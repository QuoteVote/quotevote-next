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
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { SEND_MAGIC_LINK } from "@/graphql/mutations";

export function LoginOptionsModal({ email, isOpen, onClose }: LoginOptionsModalProps) {
  const router = useRouter();
  const [sendMagicLink] = useMutation(SEND_MAGIC_LINK);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!email) return null;

  const handleSendMagicLink = async () => {
    try {
      setLoading(true);
      await sendMagicLink({ variables: { email } });
      setSuccess(true);
      toast.success("Login link sent! Check your email.");
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      const error = err as Error;
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithPassword = () => {
    router.push("/auths/login?email=" + encodeURIComponent(email));
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
          <DialogTitle>We recognize this email.</DialogTitle>
          <DialogDescription>Choose how you&apos;d like to log in</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Button
            onClick={handleSendMagicLink}
            disabled={loading || success}
            className="w-full"
          >
            {success ? "Login link sent!" : "Send me a login link"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLoginWithPassword}
          >
            Login with password
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
