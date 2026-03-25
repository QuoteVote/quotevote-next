'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { VERIFY_PASSWORD_RESET_TOKEN } from '@/graphql/queries'
import { UPDATE_USER_PASSWORD } from '@/graphql/mutations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8)
      .regex(
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Must have uppercase, lowercase, number'
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
      Update Password
    </Button>
  )
}

export default function PasswordResetPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const username = searchParams.get('username') ?? ''

  const { data, loading } = useQuery(VERIFY_PASSWORD_RESET_TOKEN, {
    variables: { token },
    skip: !token,
  })
  const [updatePassword] = useMutation(UPDATE_USER_PASSWORD)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const isValidToken = Boolean(
    data && (data as { verifyUserPasswordResetToken?: unknown }).verifyUserPasswordResetToken
  )

  const onSubmit = async (values: FormData) => {
    try {
      await updatePassword({
        variables: { token, password: values.newPassword, username },
      })
      toast.success('Password updated!')
      setTimeout(() => router.push('/auths/login'), 2000)
    } catch (error) {
      toast.error(
        replaceGqlError(error instanceof Error ? error.message : 'Failed to reset password')
      )
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Invalid Link</h1>
        <p className="text-muted-foreground text-sm">No reset token found.</p>
        <Link href="/auths/forgot-password" className="text-primary hover:underline text-sm">
          Request a new link
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin h-6 w-6 text-primary" />
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Link Expired</h1>
        <p className="text-muted-foreground text-sm">
          This reset link is invalid or expired.
        </p>
        <Link href="/auths/forgot-password" className="text-primary hover:underline text-sm">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Set New Password</h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="••••••••"
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p className="text-sm text-destructive">{errors.newPassword.message}</p>
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
        <SubmitButton />
      </form>
    </div>
  )
}
