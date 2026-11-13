"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";
import { Tabs as TabsPrimitive } from "radix-ui";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  AvatarStage,
  AvatarToolbar,
  ShuffleLocks,
  SideLabel,
  SizePreview,
  UnsavedBadge,
} from "@/components/AvatarEditor/AvatarPreview";
import { ClothingTab } from "@/components/AvatarEditor/ClothingTab";
import { ColorsTab } from "@/components/AvatarEditor/ColorsTab";
import { FaceTab } from "@/components/AvatarEditor/FaceTab";
import { HairTab } from "@/components/AvatarEditor/HairTab";
import { LeaveDialog } from "@/components/AvatarEditor/LeaveDialog";
import { PhoneToolbar } from "@/components/AvatarEditor/PhoneToolbar";
import { UPDATE_USER_AVATAR } from "@/graphql/mutations";
import { GET_USER } from "@/graphql/queries";
import { useAvatarEditor } from "@/hooks/useAvatarEditor";
import { useUnsavedChangesGuard, type LeaveTarget } from "@/hooks/useUnsavedChangesGuard";
import { downloadAvatarPng } from "@/lib/avatarDownload";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import type {
  AvatarEditorProps,
  AvatarTab,
  AvatarTabProps,
  UpdateUserAvatarData,
} from "@/types/avatar";

const TABS: { id: AvatarTab; label: string; Panel: (props: AvatarTabProps) => ReactNode }[] = [
  { id: "hair", label: "Hair", Panel: HairTab },
  { id: "face", label: "Face", Panel: FaceTab },
  { id: "clothing", label: "Clothing", Panel: ClothingTab },
  { id: "colors", label: "Colors", Panel: ColorsTab },
];

const BUTTON =
  "inline-flex h-[42px] cursor-pointer items-center justify-center gap-2 rounded-[10px] border px-[18px] text-sm font-bold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60";
const PRIMARY = `${BUTTON} border-[var(--ae-green)] bg-[var(--ae-green)] text-white`;
const SECONDARY = `${BUTTON} border-[var(--ae-line-2)] bg-[var(--ae-surface)] text-[var(--ae-ink)]`;

/** The avatar editor (#656): preview column, four option tabs, and save/leave handling. */
export function AvatarEditor({
  initial,
  userId,
  username,
  hasImageAvatar,
}: AvatarEditorProps): ReactNode {
  const router = useRouter();
  const editor = useAvatarEditor(initial);
  const updateStoreAvatar = useAppStore((state) => state.updateAvatar);
  const [tab, setTab] = useState<AvatarTab>("hair");
  const [showSaved, setShowSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<LeaveTarget | null>(null);
  const [updateUserAvatar, { loading: saving }] =
    useMutation<UpdateUserAvatarData>(UPDATE_USER_AVATAR);
  const profileHref = `/profile/${encodeURIComponent(username)}`;
  const guard = useUnsavedChangesGuard(editor.isDirty, setLeaveTarget);

  const leaveTo = (target: LeaveTarget): void => {
    if (target.kind === "back") guard.goBack();
    else {
      guard.allowLeave();
      router.push(target.href);
    }
  };
  const requestLeave = (href: string): void => {
    if (editor.isDirty) setLeaveTarget({ kind: "href", href });
    else router.push(href);
  };

  const handleSave = async (): Promise<void> => {
    const draft = editor.draft;
    try {
      await updateUserAvatar({
        variables: { user_id: userId, avatarQualities: draft },
        refetchQueries: [{ query: GET_USER, variables: { username } }],
        awaitRefetchQueries: true,
      });
      editor.markSaved(draft);
      updateStoreAvatar(draft);
      toast.success("Avatar saved");
      guard.allowLeave();
      router.push(profileHref);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your avatar. Try again.");
    }
  };

  const handleDownload = async (): Promise<void> => {
    setDownloading(true);
    try {
      await downloadAvatarPng(editor.draft, `${username}-avatar.png`);
    } catch {
      toast.error("Could not create the PNG. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  const toolbar = { editor, downloading, onDownload: () => void handleDownload() };
  const stage = { draft: editor.draft, saved: editor.saved, showSaved, onShowSaved: setShowSaved };
  const changes = editor.changeCount === 1 ? "1 change" : `${editor.changeCount} changes`;
  const saveLabel = saving ? "Saving…" : "Save avatar";

  return (
    <div className="avatar-editor -mx-4 pb-[calc(96px+env(safe-area-inset-bottom))] lg:mx-0 lg:pt-6 lg:pb-14">
      {/* Phone header */}
      <div className="flex h-14 items-center justify-between border-b border-[var(--ae-line)] bg-[var(--ae-surface)] pr-3 pl-1.5 lg:hidden">
        <button
          type="button"
          aria-label="Back to profile"
          onClick={() => requestLeave(profileHref)}
          className="flex size-10 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-[var(--ae-ink)]"
        >
          <ChevronLeft className="size-[22px]" strokeWidth={2.4} aria-hidden="true" />
        </button>
        <h1 className="m-0 text-base! leading-normal! font-extrabold! tracking-normal!">
          Customize avatar
        </h1>
        {editor.isDirty ? <UnsavedBadge /> : <span aria-hidden="true" className="w-10" />}
      </div>

      {/* Desktop header */}
      <nav
        aria-label="Breadcrumb"
        className="hidden items-center gap-1.5 text-[13.5px] font-semibold text-[var(--ae-muted)] lg:flex"
      >
        <Link href={profileHref} className="text-[var(--ae-muted)] hover:underline">
          Profile
        </Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <span aria-current="page" className="font-bold text-[var(--ae-ink)]">
          Avatar
        </span>
      </nav>
      <div className="mt-2.5 mb-[22px] hidden items-end justify-between lg:flex">
        <div>
          <h1 className="m-0 text-[30px]! leading-[1.2]! font-extrabold! tracking-[-0.02em]!">
            Customize your avatar
          </h1>
          <p className="mt-1.5 mb-0 text-[15px] leading-normal! text-[var(--ae-muted)]">
            Choose a look for your profile. Changes are only saved when you press Save.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button type="button" className={SECONDARY} onClick={() => requestLeave(profileHref)}>
            Cancel
          </button>
          <button
            type="button"
            className={PRIMARY}
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {saveLabel}
          </button>
        </div>
      </div>

      {hasImageAvatar && !editor.isDirty && (
        <p className="mx-4 my-3 rounded-xl bg-[var(--ae-amber-soft)] px-3.5 py-2.5 text-[13.5px] font-semibold text-[var(--ae-amber-ink)] lg:mx-0 lg:mt-0">
          Your profile shows a photo right now. It stays until you save an avatar here.
        </p>
      )}

      <div className="bg-[var(--ae-surface)] lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:overflow-hidden lg:rounded-[20px] lg:border lg:border-[var(--ae-line)] lg:bg-[var(--ae-surface)] lg:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.12)]">
        {/* Desktop side column */}
        <aside
          className="hidden flex-col gap-[22px] border-r border-[var(--ae-line)] bg-[var(--ae-side)] p-6 lg:flex"
          aria-label="Avatar preview"
        >
          <AvatarStage {...stage} />
          <div className="flex items-center justify-between">
            <div>
              <b className="block text-[15px]">{username}</b>
              <small className="mt-0.5 block text-[12.5px] font-semibold text-[var(--ae-muted)]">
                @{username}
                {editor.isDirty ? ` · ${changes}` : ""}
              </small>
            </div>
            {editor.isDirty && <UnsavedBadge />}
          </div>
          <AvatarToolbar {...toolbar} />
          <div>
            <SideLabel>Shuffle keeps</SideLabel>
            <ShuffleLocks locks={editor.locks} onToggle={editor.toggleLock} />
          </div>
          <div>
            <SideLabel>How it looks</SideLabel>
            <SizePreview draft={editor.draft} />
          </div>
        </aside>

        {/* Phone preview */}
        <div className="lg:hidden">
          <AvatarStage {...stage} compact />
          <PhoneToolbar {...toolbar} />
        </div>

        <TabsPrimitive.Root
          value={tab}
          onValueChange={(v) => setTab(v as AvatarTab)}
          className="flex min-w-0 flex-col"
        >
          <TabsPrimitive.List
            aria-label="Avatar parts"
            className="flex gap-0 overflow-x-auto border-b border-[var(--ae-line)] bg-[var(--ae-surface)] px-2 lg:gap-1 lg:px-6"
          >
            {TABS.map((t) => (
              <TabsPrimitive.Trigger
                key={t.id}
                value={t.id}
                className="-mb-px flex h-12 shrink-0 cursor-pointer items-center border-0 border-b-[2.5px] border-transparent bg-transparent px-3 text-sm font-bold text-[var(--ae-muted)] data-[state=active]:border-[var(--ae-green)] data-[state=active]:text-[var(--ae-ink)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2457E6] lg:h-14 lg:px-3.5 lg:text-[15px]"
              >
                {t.label}
              </TabsPrimitive.Trigger>
            ))}
          </TabsPrimitive.List>
          {TABS.map(({ id, Panel }) => (
            <TabsPrimitive.Content
              key={id}
              value={id}
              className="flex flex-col px-4 pt-3 outline-none lg:px-6 lg:pt-5 lg:pb-7"
            >
              <Panel draft={editor.draft} set={editor.set} />
            </TabsPrimitive.Content>
          ))}
        </TabsPrimitive.Root>
      </div>

      {/* Phone action bar, above the app's bottom navigation */}
      <div className="fixed inset-x-0 bottom-[56px] z-[55] flex gap-2.5 border-t border-[var(--ae-line)] bg-[var(--ae-surface)] px-4 pt-3 pb-3 md:bottom-0 lg:hidden">
        <button
          type="button"
          className={cn(SECONDARY, "h-12 flex-1")}
          onClick={() => requestLeave(profileHref)}
        >
          Cancel
        </button>
        <button
          type="button"
          className={cn(PRIMARY, "h-12 flex-1")}
          onClick={() => void handleSave()}
          disabled={saving}
        >
          {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {saveLabel}
        </button>
      </div>

      <LeaveDialog
        open={leaveTarget !== null}
        saved={editor.saved}
        draft={editor.draft}
        changeCount={editor.changeCount}
        onKeepEditing={() => setLeaveTarget(null)}
        onDiscard={() => {
          const target = leaveTarget;
          setLeaveTarget(null);
          if (target) leaveTo(target);
        }}
      />
    </div>
  );
}
