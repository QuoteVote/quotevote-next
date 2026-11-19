"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@apollo/client/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AccessField } from "@/components/Access/AccessField";
import { DisplayAvatar } from "@/components/DisplayAvatar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ProfileBackgroundPicker } from "@/components/Profile/ProfileBackgroundPicker";
import { UPDATE_USER } from "@/graphql/mutations";
import { GET_USER, GET_USER_BIO } from "@/graphql/queries";
import { replaceGqlError } from "@/lib/utils/replaceGqlError";
import { useAppStore } from "@/store/useAppStore";
import { useProfileBackground } from "@/hooks/useProfileBackground";
import { getProfileBackgroundStyle } from "@/lib/utils/profileBackground";
import { PROFILE_BIO_HTML_PATTERN, PROFILE_BIO_MAX_LENGTH } from "@/lib/constants/profile";
import type { ProfileBackgroundPattern } from "@/types/profile";
import type { SettingsUserData } from "@/types/settings";
import type { UpdateUserResponse } from "@/types/test";

/**
 * The 4-character minimum applies to a new username only, so people whose
 * existing username is shorter can still save their other details.
 */
function buildEditProfileSchema(savedUsername: string) {
  return z.object({
    name: z.string().trim().min(1, "Name is required").max(50, "Name must be under 50 characters"),
    username: z
      .string()
      .trim()
      .min(1, "Username is required")
      .max(50, "Username must be under 50 characters")
      .refine((val) => val === savedUsername || val.length >= 4, {
        message: "Username must be at least 4 characters",
      }),
    bio: z
      .string()
      .max(PROFILE_BIO_MAX_LENGTH, `About must be ${PROFILE_BIO_MAX_LENGTH} characters or fewer`)
      .refine((val) => !PROFILE_BIO_HTML_PATTERN.test(val), {
        message: "About must be plain text without HTML",
      }),
  });
}

type EditProfileValues = z.infer<ReturnType<typeof buildEditProfileSchema>>;

function subscribePersistHydration(onChange: () => void): () => void {
  return useAppStore.persist.onFinishHydration(onChange);
}

function getPersistHydrated(): boolean {
  return useAppStore.persist.hasHydrated();
}

interface EditProfilePageClientProps {
  username: string;
}

/**
 * Edit Profile (#536): everything other people see on the profile, i.e. photo,
 * name, username, About and banner. Account and app preferences stay in Settings.
 */
export default function EditProfilePageClient({
  username: routeUsername,
}: EditProfilePageClientProps) {
  const router = useRouter();
  const userData = useAppStore((state) => state.user.data) as SettingsUserData | undefined;
  const setUserData = useAppStore((state) => state.setUserData);
  const storeHydrated = useSyncExternalStore(
    subscribePersistHydration,
    getPersistHydrated,
    () => false
  );
  const background = useProfileBackground();

  const username = userData?.username ?? "";
  const name = userData?.name ?? "";
  const userId = userData?.id ?? userData?._id ?? "";
  const isOwnProfile = Boolean(username) && username.toLowerCase() === routeUsername.toLowerCase();

  // Only your own profile can be edited: send anyone else's /edit URL to yours.
  useEffect(() => {
    if (!storeHydrated) return;
    if (!username) {
      router.replace("/auths/login");
    } else if (!isOwnProfile) {
      router.replace(`/profile/${username}/edit`);
    }
  }, [storeHydrated, username, isOwnProfile, router]);

  // The banner is kept on this device. Edit a draft so Cancel leaves it as it was.
  const [bannerColor, setBannerColor] = useState(background.color);
  const [bannerPattern, setBannerPattern] = useState<ProfileBackgroundPattern>(background.pattern);
  const bannerDirty =
    bannerColor.toLowerCase() !== background.color.toLowerCase() ||
    bannerPattern !== background.pattern;

  const [updateUser, { loading: saving }] = useMutation<UpdateUserResponse>(UPDATE_USER);
  const { data: bioData, error: bioError } = useQuery<{
    user?: { _id: string; bio?: string | null } | null;
  }>(GET_USER_BIO, {
    variables: { username },
    skip: !username,
    errorPolicy: "all",
  });
  // A hosted schema without User.bio returns an error here; hide About rather than send it.
  const bioSupported = Boolean(username) && !bioError;
  const savedBio = bioData?.user?.bio ?? userData?.bio ?? "";

  const schema = useMemo(() => buildEditProfileSchema(username), [username]);
  const form = useForm<EditProfileValues>({
    resolver: zodResolver(schema),
    defaultValues: { name, username, bio: savedBio },
    values: { name, username, bio: savedBio },
    // Saved values can arrive after the user has typed and pressed Save; keep both
    // their edits and any validation errors when they do.
    resetOptions: { keepDirtyValues: true, keepErrors: true },
  });

  const isDirty = form.formState.isDirty || bannerDirty;
  const watched = useWatch({ control: form.control });

  const onSubmit = async (values: EditProfileValues) => {
    const saveBanner = () => {
      background.setColor(bannerColor);
      background.setPattern(bannerPattern);
    };

    if (!form.formState.isDirty) {
      saveBanner();
      toast.success("Profile saved");
      router.push(`/profile/${username}`);
      return;
    }

    const userInput: Record<string, unknown> = {
      _id: userId,
      name: values.name,
      username: values.username,
    };
    if (bioSupported) userInput.bio = values.bio;

    try {
      const result = await updateUser({
        variables: { user: userInput },
        refetchQueries: [
          { query: GET_USER, variables: { username: values.username } },
          ...(bioSupported
            ? [{ query: GET_USER_BIO, variables: { username: values.username } }]
            : []),
        ],
        awaitRefetchQueries: true,
      });
      const updated = result.data?.updateUser;
      if (!updated) return;
      setUserData({
        ...userData,
        ...updated,
        avatar: userData?.avatar as string | undefined,
        bio: bioSupported ? values.bio : userData?.bio,
      });
      saveBanner();
      toast.success("Profile saved");
      router.push(`/profile/${updated.username ?? values.username}`);
    } catch (err) {
      const message = replaceGqlError(
        err instanceof Error ? err.message : "Failed to save your profile"
      );
      if (/username/i.test(message)) {
        form.setError("username", { message }, { shouldFocus: true });
      } else {
        toast.error(message);
      }
    }
  };

  if (!storeHydrated || !isOwnProfile) return <LoadingSpinner />;

  const profileHref = `/profile/${username}`;
  const errors = form.formState.errors;
  const bioLength = watched.bio?.length ?? 0;
  const section =
    "flex flex-col gap-4 rounded-[18px] border border-[var(--inv-panel-line)] bg-[var(--auth-surface)] p-6 shadow-[var(--inv-panel-shadow)] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2";
  const h2 = "m-0 text-base! leading-normal! font-bold tracking-normal!";

  return (
    <div
      className="qv-auth qv-pub min-h-[calc(100dvh-var(--app-header-h))] bg-[var(--inv-ground)]! font-redesign"
      data-testid="edit-profile-page"
    >
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-[18px] px-4 pt-8 pb-12 xl:px-0">
        <Link
          href={profileHref}
          className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-bold text-[#2a3530] no-underline hover:underline [.dark_&]:text-[var(--auth-ink-2)]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to profile
        </Link>
        <h1 className="qv-auth-display m-0 text-[34px]! lg:text-[44px]!">Edit profile</h1>

        <div className="flex flex-col-reverse gap-7 lg:flex-row lg:items-start">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-w-0 flex-1 flex-col gap-4"
            noValidate
          >
            <section className={section} aria-labelledby="edit-photo">
              <h2 id="edit-photo" className={h2}>
                Photo
              </h2>
              <div className="flex items-center gap-[18px]">
                <DisplayAvatar
                  avatar={userData?.avatar as string | Record<string, unknown> | undefined}
                  username={name || username}
                  size={84}
                />
                <Link
                  href={`/profile/${username}/avatar`}
                  data-testid="change-photo"
                  className="qv-auth-btn"
                >
                  Change photo
                </Link>
              </div>
            </section>

            <section className={section} aria-labelledby="edit-details">
              <h2 id="edit-details" className={h2}>
                Details
              </h2>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <AccessField
                  id="edit-name"
                  label="Display name"
                  autoComplete="name"
                  maxLength={50}
                  error={errors.name?.message}
                  {...form.register("name")}
                />
                <AccessField
                  id="edit-username"
                  label="Username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={50}
                  error={errors.username?.message}
                  {...form.register("username")}
                />
              </div>
              {bioSupported && (
                <div className="qv-auth-field">
                  <div className="flex justify-between">
                    <label htmlFor="edit-bio" className="qv-auth-label">
                      About
                    </label>
                    <span className="qv-auth-hint tabular-nums" aria-live="polite">
                      {bioLength} / {PROFILE_BIO_MAX_LENGTH}
                    </span>
                  </div>
                  <textarea
                    id="edit-bio"
                    rows={3}
                    maxLength={PROFILE_BIO_MAX_LENGTH}
                    aria-invalid={errors.bio ? true : undefined}
                    aria-describedby={errors.bio ? "edit-bio-error" : undefined}
                    className="qv-auth-input h-auto! resize-none py-3 leading-[1.55]"
                    {...form.register("bio")}
                  />
                  {errors.bio && (
                    <p id="edit-bio-error" role="alert" className="qv-auth-err">
                      {errors.bio.message}
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className={section} aria-labelledby="edit-banner">
              <div className="flex items-baseline justify-between">
                <h2 id="edit-banner" className={h2}>
                  Banner
                </h2>
                <span className="qv-auth-hint">Saved on this device</span>
              </div>
              <ProfileBackgroundPicker
                color={bannerColor}
                pattern={bannerPattern}
                onColorChange={setBannerColor}
                onPatternChange={setBannerPattern}
              />
            </section>

            <div className="flex justify-end gap-2.5">
              <Link href={profileHref} className="qv-auth-btn">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={!isDirty || saving}
                className="qv-auth-btn qv-auth-btn-primary px-[26px]!"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </form>

          <aside
            aria-label="Live preview"
            className="w-full shrink-0 lg:sticky lg:top-[calc(var(--app-header-h)+24px)] lg:w-[380px]"
          >
            <span className="qv-auth-eyebrow">Live preview</span>
            <div className="mt-2.5 overflow-hidden rounded-[18px] border border-[var(--inv-panel-line)] bg-[var(--auth-surface)] shadow-[0_20px_40px_-24px_rgba(22,32,27,0.4)] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2">
              <div
                role="img"
                aria-label="Banner preview"
                className="h-[110px]"
                style={getProfileBackgroundStyle(bannerColor, bannerPattern, 28)}
              />
              <div className="px-5 pb-5">
                <div className="-mt-[38px] w-fit rounded-full border-4 border-[var(--auth-surface)]">
                  <DisplayAvatar
                    avatar={userData?.avatar as string | Record<string, unknown> | undefined}
                    username={name || username}
                    size={68}
                  />
                </div>
                <p className="qv-auth-display mt-2 mb-0 text-[26px]!">
                  {watched.name || name || username}
                </p>
                <p className="mt-0.5 mb-2 text-[13px] text-[var(--auth-muted)]">
                  @{watched.username || username}
                </p>
                {bioSupported && (watched.bio || "") && (
                  <p className="m-0 text-sm leading-[1.55]! text-[var(--auth-ink)]">
                    {watched.bio}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
