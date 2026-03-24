'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@apollo/client/react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { UPDATE_USER } from '@/graphql/mutations'
import { VERIFY_PASSWORD_RESET_TOKEN } from '@/graphql/queries'
import { setToken } from '@/lib/auth'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

interface VerifyTokenData {
  verifyUserPasswordResetToken: {
    _id: string
    username: string
    email: string
  } | null
}

interface UpdateUserData {
  updateUser: Record<string, unknown>
}

const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Min 3 chars')
      .max(20)
      .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
    email: z.string().email('Invalid email'),
    password: z
      .string()
      .min(8, 'Min 8 chars')
      .regex(
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Must contain uppercase, lowercase, and number'
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const setUserData = useAppStore((s) => s.setUserData)
  const [submitting, setSubmitting] = useState(false)

  // Verify the invite token
  const { data: tokenData, loading: tokenLoading, error: tokenError } = useQuery<VerifyTokenData>(VERIFY_PASSWORD_RESET_TOKEN, {
    variables: { token },
    skip: !token,
  })

  const verifiedUser = tokenData?.verifyUserPasswordResetToken

  const [updateUser] = useMutation<UpdateUserData>(UPDATE_USER)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (values: SignupFormData) => {
    setSubmitting(true)
    try {
      if (token && verifiedUser) {
        // Invite-based signup: update the existing user via GraphQL
        setToken(token)
        const result = await updateUser({
          variables: {
            user: {
              _id: verifiedUser._id,
              email: values.email,
              name: '',
              username: values.username,
              password: values.password,
            },
          },
        })
        if (result.data?.updateUser) {
          setUserData(result.data.updateUser as Record<string, unknown>)
          toast.success('Account set up! Redirecting...')
          router.push('/dashboard/explore')
          return
        }
      } else {
        // Direct signup via REST /register endpoint
        const { env } = await import('@/config/env')
        const response = await fetch(`${env.serverUrl}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: values.username,
            email: values.email,
            username: values.username,
            password: values.password,
            status: 'active',
          }),
        })
        const data = await response.json()
        if (!response.ok) {
          toast.error(data?.error_message || data?.message || 'Signup failed')
          return
        }
        toast.success('Account created! Please sign in.')
        router.push('/auths/login')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  // If token is provided, show loading while verifying
  if (token && tokenLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  // If token provided but invalid
  if (token && !tokenLoading && (!verifiedUser || tokenError)) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Invalid Invite</h1>
        <p className="text-muted-foreground">
          This invite link is invalid or has expired.
        </p>
        <Link href="/auths/request-access" className="text-primary hover:underline">
          Request a new invite
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-muted-foreground text-sm">Join Quote.Vote</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" placeholder="johndoe" {...register('username')} />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          Create Account
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auths/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
