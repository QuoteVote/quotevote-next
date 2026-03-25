'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@apollo/client/react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { SEND_PASSWORD_RESET_EMAIL } from '@/graphql/mutations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'

const schema = z.object({ email: z.string().email('Invalid email') })
type FormData = z.infer<typeof schema>

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
      Send Reset Link
    </Button>
  )
}

function EmailSentView({ email }: { email: string }) {
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-xl font-semibold">Check your inbox</h2>
      <p className="text-muted-foreground text-sm">
        We sent a reset link to <strong>{email}</strong>
      </p>
      <Link href="/auths/login" className="text-primary hover:underline text-sm block">
        Back to sign in
      </Link>
    </div>
  )
}

export default function ForgotPasswordPageContent() {
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [sendEmail] = useMutation(SEND_PASSWORD_RESET_EMAIL)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormData) => {
    try {
      await sendEmail({ variables: { email: values.email } })
      setSentEmail(values.email)
    } catch (error) {
      toast.error(
        replaceGqlError(error instanceof Error ? error.message : 'Failed to send reset email')
      )
    }
  }

  if (sentEmail) return <EmailSentView email={sentEmail} />

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Forgot Password?</h1>
        <p className="text-muted-foreground text-sm">Enter your email to receive a reset link</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <SubmitButton />
      </form>
      <Link
        href="/auths/login"
        className="text-primary hover:underline text-sm block text-center"
      >
        Back to sign in
      </Link>
    </div>
  )
}
