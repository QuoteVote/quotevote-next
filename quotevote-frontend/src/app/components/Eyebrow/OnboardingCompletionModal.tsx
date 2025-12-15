import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoginOptionsModalProps } from "@/types/eyebrow";

const OnboardingCompletionModal = ({ isOpen, onClose }: LoginOptionsModalProps) => {
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
          <Button className="w-full">Send me a link to finish onboarding</Button>
          <Button variant="outline" className="w-full">
            Create Password now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingCompletionModal;
