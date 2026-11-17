"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { AvatarCircle } from "@/components/AvatarEditor/AvatarArt";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { avatarEditorFont } from "@/lib/fonts/avatarEditorFont";
import { cn } from "@/lib/utils";
import type { LeaveDialogProps } from "@/types/avatar";

const BTN =
  "inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-[10px] border text-sm font-bold";

function LeaveBody(
  props: LeaveDialogProps & {
    Title: typeof AlertDialogTitle | typeof SheetTitle;
    Description: typeof AlertDialogDescription | typeof SheetDescription;
  }
): ReactNode {
  const { saved, draft, changeCount, onKeepEditing, onDiscard, Title, Description } = props;
  const changes = changeCount === 1 ? "1 change" : `${changeCount} changes`;
  return (
    <div className="avatar-editor flex flex-col gap-3.5">
      <div className="flex items-center gap-3" aria-hidden="true">
        <AvatarCircle draft={saved} size={52} />
        <ChevronRight className="size-[18px] text-[var(--ae-muted-2)]" />
        <AvatarCircle draft={draft} size={52} />
      </div>
      <Title className="m-0 mt-1 text-[19px]! leading-tight! font-extrabold! tracking-normal! text-[var(--ae-ink)]">
        Leave without saving?
      </Title>
      <Description className="m-0 text-[14.5px] leading-relaxed text-[var(--ae-muted)]">
        You made {changes} to your avatar. If you leave now, your profile keeps the saved one.
      </Description>
      <button
        type="button"
        autoFocus
        onClick={onKeepEditing}
        className={`${BTN} border-[var(--ae-green)] bg-[var(--ae-green)] text-white`}
      >
        Keep editing
      </button>
      <button
        type="button"
        onClick={onDiscard}
        className={`${BTN} border-[var(--ae-danger-line)] bg-[var(--ae-surface)] text-[var(--ae-danger)]`}
      >
        Discard changes
      </button>
    </div>
  );
}

/** Asks before leaving with unsaved changes: a dialog on desktop, a bottom sheet on phones. */
export function LeaveDialog(props: LeaveDialogProps): ReactNode {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const onOpenChange = (open: boolean): void => {
    if (!open) props.onKeepEditing();
  };

  if (isDesktop) {
    return (
      <AlertDialog open={props.open} onOpenChange={onOpenChange}>
        <AlertDialogContent
          className={cn(
            avatarEditorFont.variable,
            "avatar-editor max-w-[420px] rounded-2xl sm:max-w-[420px] border-[var(--ae-line)] bg-[var(--ae-surface)] p-6"
          )}
        >
          <LeaveBody {...props} Title={AlertDialogTitle} Description={AlertDialogDescription} />
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  return (
    <Sheet open={props.open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        overlayClassName="z-[70]"
        className={cn(
          avatarEditorFont.variable,
          "avatar-editor z-[70] gap-0 rounded-t-[20px] border-0 bg-[var(--ae-surface)] px-5 pt-2.5 pb-[calc(30px+env(safe-area-inset-bottom))] [&>button]:hidden"
        )}
      >
        <span
          aria-hidden="true"
          className="mx-auto mb-3 block h-[5px] w-10 rounded-full bg-[#D3D9E4]"
        />
        <LeaveBody {...props} Title={SheetTitle} Description={SheetDescription} />
      </SheetContent>
    </Sheet>
  );
}
