'use client'

import { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery } from '@apollo/client/react'
import { Camera, Loader2, Moon, Sun, LogOut, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { DisplayAvatar } from '@/components/DisplayAvatar'
import { UPDATE_USER } from '@/graphql/mutations'
import { GET_USER } from '@/graphql/queries'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'
import { useAppStore } from '@/store/useAppStore'
import { removeToken } from '@/lib/auth'
import { useTheme } from '@/context/ThemeContext'
import { useProfileBackground } from '@/hooks/useProfileBackground'
import {
  getProfileBackgroundStyle,
  PROFILE_BG_COLORS,
  PROFILE_BG_PATTERNS,
} from '@/lib/utils/profileBackground'
import { PROFILE_BIO_MAX_LENGTH, PROFILE_BIO_HTML_PATTERN } from '@/lib/constants/profile'
import { cn } from '@/lib/utils'
import type { SettingsUserData } from '@/types/settings'
import type { UpdateUserResponse } from '@/types/test'

const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be under 50 characters'),
  username: z
    .string()
    .min(4, 'Username must be at least 4 characters')
    .max(50, 'Username must be under 50 characters'),
  email: z.string().email('Please enter a valid email'),
  bio: z
    .string()
    .max(PROFILE_BIO_MAX_LENGTH, `About must be ${PROFILE_BIO_MAX_LENGTH} characters or fewer`)
    .refine((val) => !PROFILE_BIO_HTML_PATTERN.test(val), {
      message: 'About must be plain text without HTML',
    }),
  password: z.string().refine((val) => !val || val.length >= 8, {
    message: 'Password must be at least 8 characters',
  }),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function SettingsPageClient() {
  const router = useRouter()
  const userData = useAppStore((state) => state.user.data) as SettingsUserData | undefined
  const setUserData = useAppStore((state) => state.setUserData)
  const { setTheme, isDarkMode, neoBrutalism, toggleNeoBrutalism } = useTheme()
  const {
    color: profileBgColor,
    pattern: profileBgPattern,
    setColor: setProfileBgColor,
    setPattern: setProfileBgPattern,
    hydrated: profileBgHydrated,
  } = useProfileBackground()

  const username = userData?.username ?? ''
  const email = userData?.email ?? ''
  const name = userData?.name ?? ''
  const bio = typeof userData?.bio === 'string' ? userData.bio : ''
  const userId = userData?.id ?? userData?._id ?? ''

  const [localDarkMode, setLocalDarkMode] = useState(isDarkMode)
  const [originalDarkMode, setOriginalDarkMode] = useState(isDarkMode)
  const [localBrutalism, setLocalBrutalism] = useState(neoBrutalism)
  const [originalBgColor, setOriginalBgColor] = useState(profileBgColor)
  const [originalBgPattern, setOriginalBgPattern] = useState(profileBgPattern)
  const [bgBaselineReady, setBgBaselineReady] = useState(false)

  const [updateUser, { loading }] = useMutation<UpdateUserResponse>(UPDATE_USER)

  const { data: profileData } = useQuery<{ user: { bio?: string | null } | null }>(GET_USER, {
    variables: { username },
    skip: !username,
    fetchPolicy: 'cache-and-network',
  })

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { name, username, email, bio, password: '' },
  })

  useEffect(() => {
    const fetchedBio = profileData?.user?.bio
    if (typeof fetchedBio === 'string' && form.getValues('bio') === bio) {
      form.setValue('bio', fetchedBio, { shouldDirty: false })
    }
  }, [profileData?.user?.bio, bio, form])

  useEffect(() => {
    setLocalDarkMode(isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    if (!profileBgHydrated || bgBaselineReady) return
    setOriginalBgColor(profileBgColor)
    setOriginalBgPattern(profileBgPattern)
    setBgBaselineReady(true)
  }, [profileBgHydrated, profileBgColor, profileBgPattern, bgBaselineReady])

  const handleThemeToggle = useCallback(
    (checked: boolean) => {
      setTheme(checked ? 'dark' : 'light')
      setLocalDarkMode(checked)
    },
    [setTheme]
  )

  const handleBrutalismToggle = useCallback(() => {
    const next = toggleNeoBrutalism()
    setLocalBrutalism(next)
  }, [toggleNeoBrutalism])

  const themeDirty = localDarkMode !== originalDarkMode
  const bgDirty =
    bgBaselineReady &&
    (profileBgColor.toLowerCase() !== originalBgColor.toLowerCase() ||
      profileBgPattern !== originalBgPattern)
  const isFormDirty = form.formState.isDirty || themeDirty || bgDirty

  const handleSignOut = useCallback(() => {
    removeToken()
    router.push('/auths/login')
  }, [router])

  const onSubmit = async (values: SettingsFormValues) => {
    const { password, ...otherValues } = values

    // Background is localStorage-only; if that's the only change, just accept baseline.
    if (!form.formState.isDirty && !themeDirty && bgDirty) {
      setOriginalBgColor(profileBgColor)
      setOriginalBgPattern(profileBgPattern)
      toast.success('Settings saved successfully')
      return
    }

    const userInput: Record<string, unknown> = {
      _id: userId,
      ...otherValues,
      bio: otherValues.bio.trim(),
      themePreference: localDarkMode ? 'dark' : 'light',
    }
    if (password) {
      userInput.password = password
    }

    try {
      const result = await updateUser({
        variables: { user: userInput },
        refetchQueries: [
          {
            query: GET_USER,
            variables: { username: otherValues.username },
          },
        ],
        awaitRefetchQueries: true,
      })
      const updated = result.data?.updateUser
      if (updated) {
        setUserData({
          ...userData,
          ...updated,
          bio: updated.bio ?? otherValues.bio.trim(),
          avatar: userData?.avatar as string | undefined,
          themePreference: localDarkMode ? 'dark' : 'light',
        })
        setOriginalDarkMode(localDarkMode)
        setOriginalBgColor(profileBgColor)
        setOriginalBgPattern(profileBgPattern)
        toast.success('Settings saved successfully')
        form.reset({
          name: updated.name ?? otherValues.name,
          username: updated.username ?? otherValues.username,
          email: updated.email ?? otherValues.email,
          bio: (updated.bio as string | undefined) ?? otherValues.bio.trim(),
          password: '',
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save settings'
      toast.error(replaceGqlError(message))
    }
  }

  return (
    <div className="py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings & Privacy</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account details and preferences
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/profile/${username}/avatar`)}
                  className="group relative flex-shrink-0"
                  aria-label="Change avatar"
                >
                  <DisplayAvatar
                    avatar={userData?.avatar as string | Record<string, unknown> | undefined}
                    username={username}
                    size={80}
                    className="ring-2 ring-border"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="size-5 text-white" />
                  </div>
                </button>
                <div>
                  <p className="text-sm font-medium">Profile photo</p>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/profile/${username}/avatar`)}
                    className="text-sm text-primary hover:underline"
                  >
                    Change photo
                  </button>
                </div>
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your display name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell others a little about yourself"
                        rows={4}
                        maxLength={PROFILE_BIO_MAX_LENGTH}
                        className="resize-y min-h-[96px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Plain text only · {field.value?.length ?? 0}/{PROFILE_BIO_MAX_LENGTH}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    {localDarkMode ? 'Dark mode is active' : 'Light mode is active'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {localDarkMode ? (
                    <Moon className="size-4 text-muted-foreground" />
                  ) : (
                    <Sun className="size-4 text-muted-foreground" />
                  )}
                  <Switch
                    id="dark-mode"
                    checked={localDarkMode}
                    onCheckedChange={handleThemeToggle}
                    aria-label="Toggle dark mode"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="neo-brutalism">Neo-Brutalism</Label>
                  <p className="text-sm text-muted-foreground">
                    {localBrutalism
                      ? 'Bold borders, hard shadows, chunky type'
                      : 'Switch to a raw, high-contrast brutalist look'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-muted-foreground" />
                  <Switch
                    id="neo-brutalism"
                    checked={localBrutalism}
                    onCheckedChange={handleBrutalismToggle}
                    aria-label="Toggle neo-brutalism theme"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="space-y-0.5">
                  <Label>Profile Background</Label>
                  <p className="text-sm text-muted-foreground">
                    Customize your profile banner color and pattern
                  </p>
                </div>

                <div
                  className="h-20 w-full rounded-md border border-border"
                  style={getProfileBackgroundStyle(profileBgColor, profileBgPattern)}
                  aria-label="Profile background preview"
                  role="img"
                />

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Color</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {PROFILE_BG_COLORS.map((c) => {
                      const selected = profileBgColor.toLowerCase() === c.toLowerCase()
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setProfileBgColor(c)}
                          aria-label={`Background color ${c}`}
                          aria-pressed={selected}
                          className={cn(
                            'h-7 w-7 rounded-full border transition-transform hover:scale-110',
                            selected
                              ? 'ring-2 ring-offset-2 ring-primary border-transparent'
                              : 'border-border'
                          )}
                          style={{ backgroundColor: c }}
                        />
                      )
                    })}
                    <label className="ml-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <span>Custom</span>
                      <input
                        type="color"
                        value={profileBgColor}
                        onChange={(e) => setProfileBgColor(e.target.value)}
                        aria-label="Custom background color"
                        className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent p-0"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Pattern</p>
                  <div className="flex flex-wrap gap-2">
                    {PROFILE_BG_PATTERNS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setProfileBgPattern(p.value)}
                        aria-pressed={profileBgPattern === p.value}
                        className={cn(
                          'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                          profileBgPattern === p.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-foreground/80 hover:bg-muted'
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="size-4" />
                  Sign Out
                </Button>

                <div className="ml-auto">
                  <Button type="submit" disabled={!isFormDirty || loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
