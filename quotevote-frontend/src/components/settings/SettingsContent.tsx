'use client'

import { useState } from 'react'
import { useForm, type SubmitHandler, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation } from '@apollo/client/react' 
import { Camera, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

import { UPDATE_USER } from '@/graphql/mutations'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'
import Avatar from '@/components/Avatar'
import { useAppStore } from '@/store/useAppStore'
import type { 
  SettingsFormValues, 
  SettingsContentProps, 
  SettingsUserData, 
  UserAvatar 
} from '@/types/settings'
import type { UpdateUserResponse } from '@/types/test'

const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z
    .string()
    .min(5, 'Username should be more than 4 characters')
    .max(50, 'Username should be less than 50 characters'),
  email: z.string().email('Entered value does not match email format'),
  password: z
    .string()
    .optional()
    .or(z.literal('')) 
    .refine(
      (val) => {
        if (!val || val.length === 0) return true
        if (val.length < 8) return false 
        return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/.test(val)
      },
      {
        message: 'Password should contain at least 8 chars, a number, an uppercase, and lowercase letter',
      }
    ),
})

export default function SettingsContent({ setOpen }: SettingsContentProps) {
  const router = useRouter()
  const [showSuccess, setShowSuccess] = useState(false)

  const userData = useAppStore((state) => state.user.data) as SettingsUserData | undefined
  const setUserData = useAppStore((state) => state.setUserData)

  const avatar = userData?.avatar as UserAvatar | string | undefined
  const username = userData?.username ?? ''
  const email = userData?.email ?? ''
  const name = userData?.name ?? ''
  const userId = userData?.id ?? userData?._id ?? ''
  const admin = userData?.admin ?? false

  const [updateUser, { loading, error }] = useMutation<UpdateUserResponse>(UPDATE_USER)

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      username,
      name,
      email,
      password: '',
    },
  })

  const onSubmit: SubmitHandler<SettingsFormValues> = async (values) => {
    const { password, ...otherValues } = values;
    const updateVariables = !password || password.length === 0 ? otherValues : values;

    try {
      const result = await updateUser({
        variables: {
          user: {
            _id: userId,
            ...updateVariables,
          },
        },
      });

      if (result.data?.updateUser) {
        const updatedAvatar = typeof avatar === 'string' 
          ? avatar 
          : (avatar as UserAvatar)?.url || (avatar as UserAvatar)?.src || '';

        setUserData({
          ...userData,
          ...otherValues,
          avatar: updatedAvatar,
        });
        
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        form.reset(values);
      }
    } catch (err) {
      // Error handled by Apollo
    }
  };

  const avatarUrl = typeof avatar === 'string' 
    ? avatar 
    : (avatar as UserAvatar)?.url || (avatar as UserAvatar)?.src || ''

  const watchedName = (form.watch('name') as string) || name || '';

  return (
    <div className="flex h-[90vh] max-w-[350px] flex-col gap-4 overflow-auto p-4 md:min-w-[350px] sm:max-w-full sm:p-6">
      <h1 className="hidden text-2xl font-bold text-white md:block">Settings</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4">
          <div className="flex-1 space-y-4 overflow-auto">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                   if (setOpen) setOpen(false)
                   router.push(`/Profile/${username}/avatar`)
                }}
                className="group relative flex-shrink-0"
                aria-label="Change avatar"
              >
                <Avatar 
                  src={avatarUrl}
                  alt={watchedName || 'User avatar'}
                  size={96}
                  fallback={watchedName.charAt(0).toUpperCase() || 'U'}
                  className="h-20 w-20 md:h-24 md:w-24"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </button>

              <Card className="flex-1">
                <CardContent className="p-4">
                  <FormField
                    control={form.control as Control<SettingsFormValues>}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <FormField
                  control={form.control as Control<SettingsFormValues>}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <FormField
                  control={form.control as Control<SettingsFormValues>}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <FormField
                  control={form.control as Control<SettingsFormValues>}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Password <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <a
                  href="/forgot-password"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-right text-sm text-blue-500 hover:underline"
                >
                  Forgot Password?
                </a>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{replaceGqlError(error.message)}</AlertDescription>
              </Alert>
            )}

            {showSuccess && (
              <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
                <AlertDescription>Successfully saved!</AlertDescription>
              </Alert>
            )}
          </div>

          <div className={cn(
            "mt-auto flex items-center justify-between gap-2 border-t pt-4",
            "sm:sticky sm:bottom-0 sm:bg-background"
          )}>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (setOpen) setOpen(false)
                localStorage.removeItem('token')
                useAppStore.getState().logout()
                router.push('/login')
              }}
              disabled={loading}
            >
              Sign Out
            </Button>

            {admin && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                    router.push('/dashboard/control-panel')
                    if (setOpen) setOpen(false)
                }}
                disabled={loading}
              >
                Manage Invites
              </Button>
            )}

            <Button type="submit" disabled={!form.formState.isDirty || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </form>
      </Form>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
    </div>
  )
}