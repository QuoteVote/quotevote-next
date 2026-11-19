"use client";

import { Menu } from "lucide-react";
import { useProfileBackground } from "@/hooks/useProfileBackground";
import { OPEN_ACCOUNT_MENU_EVENT } from "@/lib/constants/accountMenu";
import {
  DEFAULT_PROFILE_BG_COLOR,
  DEFAULT_PROFILE_BG_PATTERN,
  getProfileBackgroundStyle,
} from "@/lib/utils/profileBackground";
import { useAppStore } from "@/store";
import type { ProfileBannerProps } from "@/types/profile";

/** The full-width banner at the top of a profile (redesign), with the phone menu button. */
export function ProfileBanner({ own }: ProfileBannerProps) {
  const { color, pattern } = useProfileBackground();
  const signedIn = useAppStore((s) => Boolean(s.user.data?._id || s.user.data?.id));
  const style = own
    ? getProfileBackgroundStyle(color, pattern, 36)
    : getProfileBackgroundStyle(DEFAULT_PROFILE_BG_COLOR, DEFAULT_PROFILE_BG_PATTERN, 36);

  return (
    <section
      aria-label="Profile banner"
      className="relative h-[120px] overflow-hidden lg:h-[200px]"
    >
      <div className="absolute inset-0" style={style} data-testid="profile-cover" />
      {signedIn && (
        <button
          type="button"
          aria-label="Open menu"
          className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-[12px] text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white md:hidden"
          onClick={() => window.dispatchEvent(new Event(OPEN_ACCOUNT_MENU_EVENT))}
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
