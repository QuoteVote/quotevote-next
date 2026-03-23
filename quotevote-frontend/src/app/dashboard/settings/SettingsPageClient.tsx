'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation } from '@apollo/client/react'
import { Camera, Loader2, User, Lock, Shield } from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import Avatar from '@/components/Avatar'
import { UPDATE_USER } from '@/graphql/mutations'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'
import { useAppStore } from '@/store/useAppStore'
import { removeToken } from '@/lib/auth'
import type { UserAvatar, SettingsUserData } from '@/types/settings'
import type { UpdateUserResponse } from '@/types/test'

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be under 50 characters'),
  username: z
    .string()
    .min(5, 'Username must be at least 5 characters')
    .max(50, 'Username must be under 50 characters'),
  email: z.string().email('Please enter a valid email'),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/\d/, 'Must include a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ProfileFormValues = z.infer<typeof profileSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Shield },
  { id: 'password', label: 'Password', icon: Lock },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

export default function SettingsPageClient() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<SectionId>('profile')

  const userData = useAppStore((state) => state.user.data) as SettingsUserData | undefined
  const setUserData = useAppStore((state) => state.setUserData)

  const avatar = userData?.avatar as UserAvatar | string | undefined
  const username = userData?.username ?? ''
  const email = userData?.email ?? ''
  const name = userData?.name ?? ''
  const userId = userData?.id ?? userData?._id ?? ''
  const accountStatus = (userData as Record<string, unknown>)?.accountStatus as string | undefined

  const avatarUrl =
    typeof avatar === 'string'
      ? avatar
      : (avatar as UserAvatar)?.url || (avatar as UserAvatar)?.src || ''

  const [updateUser, { loading: profileLoading }] = useMutation<UpdateUserResponse>(UPDATE_USER)

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name, username, email },
  })

  const onProfileSubmit = async (values: ProfileFormValues) => {
    try {
      const result = await updateUser({
        variables: {
          user: {
            _id: userId,
            ...values,
          },
        },
      })

      if (result.data?.updateUser) {
        setUserData({
          ...userData,
          ...values,
          avatar: avatarUrl,
        })
        toast.success('Profile updated successfully')
        profileForm.reset(values)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      toast.error(replaceGqlError(message))
    }
  }

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      await updateUser({
        variables: {
          user: {
            _id: userId,
            password: values.newPassword,
          },
        },
      })
      toast.success('Password changed. Please log in again.')
      removeToken()
      router.push('/auths/login')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password'
      toast.error(replaceGqlError(message))
    }
  }

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar navigation */}
        <nav className="md:w-56 flex-shrink-0">
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                  activeSection === id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile</CardTitle>
                <CardDescription>
                  Update your personal information and how others see you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form
                    onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                    className="space-y-6"
                  >
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/dashboard/profile/${username}/avatar`)
                        }
                        className="group relative flex-shrink-0"
                        aria-label="Change avatar"
                      >
                        <Avatar
                          src={avatarUrl}
                          alt={name || 'User avatar'}
                          size={80}
                          fallback={(name || 'U').charAt(0).toUpperCase()}
                          className="size-20 ring-2 ring-border"
                        />
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <Camera className="size-5 text-white" />
                        </div>
                      </button>
                      <div>
                        <p className="text-sm font-medium">Profile photo</p>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/dashboard/profile/${username}/avatar`)
                          }
                          className="text-sm text-primary hover:underline"
                        >
                          Change photo
                        </button>
                      </div>
                    </div>

                    <Separator />

                    {/* Name */}
                    <FormField
                      control={profileForm.control}
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
                      control={profileForm.control}
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
                      control={profileForm.control}
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

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={!profileForm.formState.isDirty || profileLoading}
                      >
                        {profileLoading ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Account Section */}
          {activeSection === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account</CardTitle>
                <CardDescription>
                  View your account information and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{email || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="text-sm font-medium">Username</p>
                    <p className="text-sm text-muted-foreground">@{username || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">Account Status</p>
                  </div>
                  <Badge variant={accountStatus === 'disabled' ? 'destructive' : 'default'}>
                    {accountStatus === 'disabled' ? 'Disabled' : 'Active'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Password Section */}
          {activeSection === 'password' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter current password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter new password" {...field} />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Must be 8+ characters with uppercase, lowercase, and a number
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirm new password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between">
                      <a
                        href="/auths/forgot-password"
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </a>
                      <Button
                        type="submit"
                        disabled={!passwordForm.formState.isDirty || profileLoading}
                      >
                        {profileLoading ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
