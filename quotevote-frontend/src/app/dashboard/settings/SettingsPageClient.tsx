'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation } from '@apollo/client/react'
import { Camera, Loader2, Moon, Sun, LogOut, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { DisplayAvatar } from '@/components/DisplayAvatar'
import { UPDATE_USER } from '@/graphql/mutations'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'
import { useAppStore } from '@/store/useAppStore'
import { removeToken } from '@/lib/auth'
import { useTheme } from '@/context/ThemeContext'
import type { SettingsUserData } from '@/types/settings'
import type { UpdateUserResponse } from '@/types/test'

const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be under 50 characters'),
  username: z
    .string()
    .min(4, 'Username must be at least 4 characters')
    .max(50, 'Username must be under 50 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().refine((val) => !val || val.length >= 8, {
    message: 'Password must be at least 8 characters',
  }),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function SettingsPageClient() {
  const router = useRouter()
  const userData = useAppStore((state) => state.user.data) as SettingsUserData | undefined
  const setUserData = useAppStore((state) => state.setUserData)
  const { toggleTheme, isDarkMode, neoBrutalism, toggleNeoBrutalism } = useTheme()

  const username = userData?.username ?? ''
  const email = userData?.email ?? ''
  const name = userData?.name ?? ''
  const userId = userData?.id ?? userData?._id ?? ''
  const isAdmin = Boolean(userData?.admin)

  const [localDarkMode, setLocalDarkMode] = useState(isDarkMode)
  const [originalDarkMode, setOriginalDarkMode] = useState(isDarkMode)
  const [localBrutalism, setLocalBrutalism] = useState(neoBrutalism)

  const [updateUser, { loading }] = useMutation<UpdateUserResponse>(UPDATE_USER)

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { name, username, email, password: '' },
  })

  const handleThemeToggle = useCallback(() => {
    const newMode = toggleTheme()
    setLocalDarkMode(newMode === 'dark')
  }, [toggleTheme])

  const handleBrutalismToggle = useCallback(() => {
    const next = toggleNeoBrutalism()
    setLocalBrutalism(next)
  }, [toggleNeoBrutalism])

  const themeDirty = localDarkMode !== originalDarkMode
  const isFormDirty = form.formState.isDirty || themeDirty

  const handleSignOut = useCallback(() => {
    removeToken()
    router.push('/auths/login')
  }, [router])

  const onSubmit = async (values: SettingsFormValues) => {
    const { password, ...otherValues } = values
    const userInput: Record<string, unknown> = {
      _id: userId,
      ...otherValues,
      themePreference: localDarkMode ? 'dark' : 'light',
    }
    if (password) {
      userInput.password = password
    }

    try {
      const result = await updateUser({ variables: { user: userInput } })
      if (result.data?.updateUser) {
        const avatarValue =
          typeof userData?.avatar === 'string'
            ? userData.avatar
            : (userData?.avatar as { url?: string } | undefined)?.url
        setUserData({
          ...userData,
          avatar: avatarValue,
          ...otherValues,
          themePreference: localDarkMode ? 'dark' : 'light',
        })
        setOriginalDarkMode(localDarkMode)
        toast.success('Settings saved successfully')
        form.reset({ ...otherValues, password: '' })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save settings'
      toast.error(replaceGqlError(message))
    }
  }

  return (
    <div className="py-6 max-w-2xl mx-auto space-y-4">
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
              {/* Avatar */}
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

              {/* Name */}
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

              {/* Username */}
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

              {/* Email */}
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

              {/* Password (optional) */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Leave blank to keep current password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Dark mode */}
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

              {/* Neo-brutalism */}
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

              {/* Footer */}
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
                {isAdmin && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push('/dashboard/invites')}
                    className="text-muted-foreground"
                  >
                    Manage Invites
                  </Button>
                )}
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
