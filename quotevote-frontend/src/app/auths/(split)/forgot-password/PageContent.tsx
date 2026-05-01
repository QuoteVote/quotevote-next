'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@apollo/client/react'
import { toast } from 'sonner'
import { Loader2, MailCheck, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { SEND_PASSWORD_RESET_EMAIL } from '@/graphql/mutations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'

const schema = z.object({ email: z.string().email('Please enter a valid email address') })
type FormData = z.infer<typeof schema>

function LeftPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #2d7a4f 0%, #52b274 60%, #6fcf97 100%)' }}
    >
      <div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
        style={{ background: '#ffffff' }}
      />
      <div
        className="absolute -bottom-32 -right-20 w-[480px] h-[480px] rounded-full opacity-10"
        style={{ background: '#ffffff' }}
      />

      <div className="relative z-10 flex flex-col items-center text-center" style={{ gap: '2rem' }}>
        <Link href="/" className="inline-flex items-center gap-3">
          <Image
            src="/icons/android-chrome-192x192.png"
            alt="Quote.Vote"
            width={52}
            height={52}
            className="object-contain drop-shadow-lg"
            priority
          />
          <span className="text-white text-4xl font-extrabold tracking-wide">Quote.Vote</span>
        </Link>
        <div className="flex flex-col" style={{ gap: '0.5rem', paddingTop: '0.25rem' }}>
          <p
            className="text-lg font-medium leading-snug"
            style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: '0.01em' }}
          >
            No algorithms. No ads. Just conversations.
          </p>
          <p
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Share Ideas. Vote on What Matters.
          </p>
        </div>
      </div>
    </div>
  )
}

function EmailSentView({ email }: { email: string }) {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12" style={{ background: '#eef4f9' }}>
      {/* Mobile logo */}
      <div className="lg:hidden mb-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image src="/icons/android-chrome-192x192.png" alt="Quote.Vote" width={28} height={28} className="object-contain" />
          <span className="text-xl font-extrabold tracking-wide" style={{ color: '#1a1a1a' }}>Quote.Vote</span>
        </Link>
      </div>

      <div className="w-full max-w-sm text-center">
        <div
          className="mx-auto mb-6 flex items-center justify-center w-16 h-16 rounded-2xl"
          style={{ background: 'rgba(82,178,116,0.12)' }}
        >
          <MailCheck className="w-8 h-8" style={{ color: '#52b274' }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#1a1a1a' }}>
          Check your inbox
        </h1>
        <p className="text-sm mb-1" style={{ color: '#6b7280' }}>
          We sent a password reset link to
        </p>
        <p className="text-sm font-semibold mb-8" style={{ color: '#1a1a1a' }}>
          {email}
        </p>
        <p className="text-xs mb-6" style={{ color: '#9ca3af' }}>
          Didn&apos;t receive it? Check your spam folder or try again with a different address.
        </p>
        <Link
          href="/auths/login"
          className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-lg text-sm font-semibold transition-colors"
          style={{ background: '#52b274', color: '#ffffff' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  )
}

export default function ForgotPasswordPageContent() {
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sendEmail] = useMutation(SEND_PASSWORD_RESET_EMAIL)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormData) => {
    setSubmitting(true)
    try {
      await sendEmail({ variables: { email: values.email } })
      setSentEmail(values.email)
    } catch (error) {
      toast.error(
        replaceGqlError(error instanceof Error ? error.message : 'Failed to send reset email')
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <LeftPanel />

      {sentEmail ? (
        <EmailSentView email={sentEmail} />
      ) : (
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-12" style={{ background: '#eef4f9' }}>
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/icons/android-chrome-192x192.png" alt="Quote.Vote" width={28} height={28} className="object-contain" />
              <span className="text-xl font-extrabold tracking-wide" style={{ color: '#1a1a1a' }}>Quote.Vote</span>
            </Link>
          </div>

          <div className="w-full max-w-sm">
            {/* Back link */}
            <Link
              href="/auths/login"
              className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors hover:opacity-70"
              style={{ color: '#52b274' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>

            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a1a1a' }}>
                Forgot your password?
              </h1>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium" style={{ color: '#374151' }}>
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-11 rounded-lg"
                  style={{ borderColor: errors.email ? '#F55145' : undefined }}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs" style={{ color: '#F55145' }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 text-sm font-semibold rounded-lg"
                style={{ background: '#52b274', color: '#ffffff' }}
              >
                {submitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                Send Reset Link
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
