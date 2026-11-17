"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@apollo/client/react";
import { ArrowLeft, Loader2, Palette } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DisplayAvatar } from "@/components/DisplayAvatar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ProfileBackgroundPicker } from "@/components/Profile/ProfileBackgroundPicker";
import { UPDATE_USER } from "@/graphql/mutations";
import { GET_USER, GET_USER_BIO } from "@/graphql/queries";
import { replaceGqlError } from "@/lib/utils/replaceGqlError";
import { useAppStore } from "@/store/useAppStore";
import { useProfileBackground } from "@/hooks/useProfileBackground";
import { cn } from "@/lib/utils";
import { PROFILE_BIO_HTML_PATTERN, PROFILE_BIO_MAX_LENGTH } from "@/lib/constants/profile";
import {
  FOCUS_RING_CLASS,
  FORM_ERROR_TEXT_CLASS,
  FORM_FIELD_CLASS,
  FORM_LABEL_CLASS,
  PRIMARY_ACTION_CLASS,
} from "@/lib/constants/formControls";
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

  return (
    <div className="space-y-4 py-6" data-testid="edit-profile-page">
      <div>
        <Link
          href={profileHref}
          className={cn(
            "mb-3 -ml-1 inline-flex min-h-8 items-center gap-1.5 rounded-md px-1 text-sm font-medium text-foreground/80 hover:text-foreground",
            FOCUS_RING_CLASS
          )}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to profile
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit profile</h1>
        <p className="mt-1 text-sm text-foreground/75">
          This is what other people see on your profile.
        </p>
      </div>

      <Card>
        <CardContent>
          <h2 className="mb-4 text-base font-semibold">Photo</h2>
          <div className="flex flex-wrap items-center gap-4">
            <DisplayAvatar
              avatar={userData?.avatar as string | Record<string, unknown> | undefined}
              username={name || username}
              size={80}
              className="ring-2 ring-border"
            />
            <Button variant="outline" asChild className={FOCUS_RING_CLASS}>
              <Link href={`/profile/${username}/avatar`} data-testid="change-photo">
                <Palette className="size-4" aria-hidden="true" />
                Customize avatar
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
              <h2 className="text-base font-semibold">Details</h2>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={FORM_LABEL_CLASS}>Display name</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="name"
                        maxLength={50}
                        placeholder="Your display name"
                        className={FORM_FIELD_CLASS}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className={FORM_ERROR_TEXT_CLASS} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={FORM_LABEL_CLASS}>Username</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        maxLength={50}
                        placeholder="username"
                        className={FORM_FIELD_CLASS}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-foreground/75">
                      Your profile address: /profile/{field.value || "username"}
                    </FormDescription>
                    <FormMessage className={FORM_ERROR_TEXT_CLASS} />
                  </FormItem>
                )}
              />

              {bioSupported && (
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={FORM_LABEL_CLASS}>About</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A short, plain-text introduction"
                          rows={4}
                          maxLength={PROFILE_BIO_MAX_LENGTH}
                          className={FORM_FIELD_CLASS}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-foreground/75 tabular-nums">
                        {field.value?.length ?? 0}/{PROFILE_BIO_MAX_LENGTH} characters
                      </FormDescription>
                      <FormMessage className={FORM_ERROR_TEXT_CLASS} />
                    </FormItem>
                  )}
                />
              )}

              <Separator />

              <div className="space-y-3">
                <div className="space-y-0.5">
                  <h2 className="text-base font-semibold">Banner</h2>
                  <p className="text-sm text-foreground/75">
                    The color and pattern behind your photo. Saved on this device.
                  </p>
                </div>
                <ProfileBackgroundPicker
                  color={bannerColor}
                  pattern={bannerPattern}
                  onColorChange={setBannerColor}
                  onPatternChange={setBannerPattern}
                />
              </div>

              <Separator />

              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button variant="outline" asChild className={FOCUS_RING_CLASS}>
                  <Link href={profileHref}>Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={!isDirty || saving}
                  className={cn(PRIMARY_ACTION_CLASS, FOCUS_RING_CLASS)}
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
