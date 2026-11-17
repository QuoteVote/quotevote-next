"use client";

/**
 * Avatar editor page (#656). The editor always edits the signed-in member's avatar
 * and saves the 13 Avataaars qualities with UPDATE_USER_AVATAR, the same format as before.
 */

import type { ReactNode } from "react";
import { AvatarEditor } from "@/components/AvatarEditor/AvatarEditor";
import { Skeleton } from "@/components/ui/skeleton";
import { useHasMounted } from "@/hooks/useMediaQuery";
import { completeDraft, readAvatarQualities } from "@/lib/avatar";
import { useAppStore } from "@/store";

type StoredAvatar = string | Record<string, unknown> | undefined | null;

/** A stored image URL (not Avataaars qualities) stays until the member saves. */
function isImageAvatar(avatar: StoredAvatar): boolean {
  return typeof avatar === "string" && avatar.trim() !== "" && readAvatarQualities(avatar) === null;
}

export default function AvatarEditorPage(): ReactNode {
  const mounted = useHasMounted();
  const userData = useAppStore((state) => state.user.data);
  const userId = (userData._id || userData.id) as string | undefined;
  const username = typeof userData.username === "string" ? userData.username : "";

  if (!mounted || !userId || !username) {
    return (
      <div className="py-6" aria-busy="true" aria-label="Loading the avatar editor">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="h-[520px] w-full rounded-[20px]" />
      </div>
    );
  }

  const avatar = userData.avatar as StoredAvatar;
  const initial = completeDraft(readAvatarQualities(avatar), username);
  return (
    <AvatarEditor
      key={userId}
      initial={initial}
      userId={userId}
      username={username}
      hasImageAvatar={isImageAvatar(avatar)}
    />
  );
}
