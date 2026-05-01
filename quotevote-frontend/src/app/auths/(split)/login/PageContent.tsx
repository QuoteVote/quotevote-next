'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { loginUser } from '@/lib/auth'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
})
type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPageContent() {
  const router = useRouter()
  const setUserData = useAppStore((s) => s.setUserData)
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginFormData) => {
    setSubmitting(true)
    try {
      const result = await loginUser(values.email, values.password)
      if (result.success && result.data) {
        setUserData(result.data.user as Record<string, unknown>)
        router.push('/dashboard/explore')
      } else {
        toast.error(result.error || 'Login failed')
      }
    } catch {
      toast.error('Connection failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — logo only */}
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
            <span className="text-white text-4xl font-extrabold tracking-wide">
              Quote.Vote
            </span>
          </Link>
          <div
            className="flex flex-col"
            style={{ gap: '0.5rem', paddingTop: '0.25rem' }}
          >
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

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/icons/android-chrome-192x192.png"
              alt="Quote.Vote"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="text-xl font-extrabold tracking-wide" style={{ color: '#1a1a1a' }}>
              Quote.Vote
            </span>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a1a1a' }}>
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              Sign in to your Quote.Vote account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: '#374151' }}>
                Username or Email
              </Label>
              <Input
                id="email"
                type="text"
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium"
                  style={{ color: '#374151' }}
                >
                  Password
                </Label>
                <Link
                  href="/auths/forgot-password"
                  className="text-xs hover:underline"
                  style={{ color: '#52b274' }}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11 rounded-lg"
                style={{ borderColor: errors.password ? '#F55145' : undefined }}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs" style={{ color: '#F55145' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 text-sm font-semibold rounded-lg mt-2"
              style={{ background: '#52b274', color: '#ffffff' }}
            >
              {submitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: '#e5e7eb' }} />
            <span className="text-xs" style={{ color: '#9ca3af' }}>
              New to Quote.Vote?
            </span>
            <div className="flex-1 h-px" style={{ background: '#e5e7eb' }} />
          </div>

          {/* Request access */}
          <Link
            href="/auths/request-access"
            className="flex items-center justify-center w-full h-11 rounded-lg border text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: '#e5e7eb', color: '#374151' }}
          >
            Request access
          </Link>
        </div>
      </div>
    </div>
  )
}
