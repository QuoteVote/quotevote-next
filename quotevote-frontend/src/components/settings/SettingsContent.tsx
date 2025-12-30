'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation } from '@apollo/client/react'
import { Camera, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'

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
import { SET_USER_DATA } from '@/store/user'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'
import { Avatar } from '@/components/Avatar'

// Define validation schema
const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z
    .string()
    .min(4, 'Username should be more than 4 characters')
    .max(50, 'Username should be less than 50 characters'),
  email: z.string().email('Entered value does not match email format'),
  password: z
    .string()
    .min(3, 'Password should be more than 3 characters')
    .max(50, 'Password should be less than 50 characters')
    .optional()
    .refine(
      (val) => {
        if (!val || val.length === 0) return true
        return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/.test(val)
      },
      {
        message: 'Password should contain a number, an uppercase, and lowercase letter',
      }
    ),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

interface SettingsContentProps {
  setOpen?: (open: boolean) => void
}

export default function SettingsContent({ setOpen }: SettingsContentProps) {
  const router = useRouter()
  const dispatch = useDispatch()
  const [showSuccess, setShowSuccess] = useState(false)

  // Get user data from Redux store
  const {
    username,
    email,
    name,
    avatar,
    _id,
    admin,
    ...otherUserData
  } = useSelector((state: any) => state.user.data)

  const [updateUser, { loading, error }] = useMutation(UPDATE_USER)

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      username,
      name,
      email,
      password: '',
    },
  })

  const handleChangeAvatar = () => {
    if (setOpen) setOpen(false)
    router.push(`/Profile/${username}/avatar`)
  }

  const handleLogout = () => {
    if (setOpen) setOpen(false)
    localStorage.removeItem('token')
    router.push('/auth/login')
  }

  const handleInvite = () => {
    router.push('/ControlPanel')
    if (setOpen) setOpen(false)
  }

  const onSubmit = async (values: SettingsFormValues) => {
    const { password, ...otherValues } = values
    const otherVariables = !password || password === username ? otherValues : values

    try {
      const result = await updateUser({
        variables: {
          user: {
            _id,
            ...otherVariables,
          },
        },
      })

      if (result.data) {
        dispatch(
          SET_USER_DATA({
            _id,
            ...otherUserData,
            ...otherValues,
          })
        )
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
        form.reset(values)
      }
    } catch (e) {
      console.error('Update failed:', e)
    }
  }

  const hasChanges = form.formState.isDirty

  return (
    <div className="flex h-[90vh] max-w-[350px] flex-col gap-4 overflow-auto p-4 md:min-w-[350px] sm:max-w-full sm:p-6">
      {/* Title - Hidden on mobile */}
      <h1 className="hidden text-2xl font-bold text-white md:block">Settings</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4">
          {/* Content Area */}
          <div className="flex-1 space-y-4 overflow-auto">
            {/* Avatar and Name Section */}
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <button
                type="button"
                onClick={handleChangeAvatar}
                className="group relative flex-shrink-0"
              >
                <Avatar 
                  src={avatar?.url || avatar?.src || avatar} 
                  alt={name || 'User avatar'}
                  size={96}
                  fallback={name?.charAt(0)?.toUpperCase()}
                  className="h-20 w-20 md:h-24 md:w-24"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </button>

              {/* Name Field */}
              <Card className="flex-1">
                <CardContent className="p-4">
                  <FormField
                    control={form.control}
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

            {/* Username Field */}
            <Card>
              <CardContent className="p-4">
                <FormField
                  control={form.control}
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

            {/* Email Field */}
            <Card>
              <CardContent className="p-4">
                <FormField
                  control={form.control}
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

            {/* Password Field */}
            <Card>
              <CardContent className="p-4">
                <FormField
                  control={form.control}
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
                  href="/auth/forgot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-right text-sm text-blue-500 hover:underline"
                >
                  Forgot Password?
                </a>
              </CardContent>
            </Card>

            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{replaceGqlError(error.message)}</AlertDescription>
              </Alert>
            )}

            {showSuccess && (
              <Alert className="border-green-500 bg-green-50 text-green-900">
                <AlertDescription>Successfully saved!</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Footer Buttons */}
          <div className={cn(
            "mt-auto flex items-center justify-between gap-2 border-t pt-4",
            "sm:sticky sm:bottom-0 sm:bg-background"
          )}>
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              disabled={loading}
            >
              Sign Out
            </Button>

            {admin && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleInvite}
                disabled={loading}
              >
                Manage Invites
              </Button>
            )}

            <Button type="submit" disabled={!hasChanges || loading}>
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

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
    </div>
  )
}
