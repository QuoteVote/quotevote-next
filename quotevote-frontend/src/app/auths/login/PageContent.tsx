'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
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
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <p className="text-muted-foreground text-sm">Welcome back to Quote.Vote</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Username or Email</Label>
          <Input id="email" type="text" placeholder="you@example.com" {...register('email')} />
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
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          Sign In
        </Button>
      </form>
      <div className="space-y-2 text-center text-sm">
        <Link href="/auths/forgot-password" className="text-primary hover:underline block">
          Forgot password?
        </Link>
        <p className="text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auths/request-access" className="text-primary hover:underline">
            Request access
          </Link>
        </p>
      </div>
    </div>
  )
}
