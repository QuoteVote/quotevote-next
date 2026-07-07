'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, User, Lock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { loginUser } from '@/lib/auth'
import { useAppStore } from '@/store/useAppStore'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

const BG_IMAGES = [
  'viviana-rishe-UC8fvOyG5pU-unsplash.jpg',
  'steph-smith-3jYcQf9oiJ8-unsplash.jpg',
  'sergio-rodriguez-rrlEOXRmMAA-unsplash.jpg',
  'sergio-otoya-gCNh426vB30-unsplash.jpg',
  'rondell-chaz-mabunga-EHLKkMDxe3M-unsplash.jpg',
  'rommel-paras-wrHnE3kMplg-unsplash.jpg',
  'peter-thomas-efLcMHXtrg0-unsplash.jpg',
  'julia-caesar-jeXkw2HR1SU-unsplash.jpg',
  'ehmir-bautista-JjDqyWuWZyU-unsplash.jpg',
  'adam-navarro-qXcl3z7_AOc-unsplash.jpg',
  'actionvance-guy5aS3GvgA-unsplash.jpg',
]

const loginSchema = z.object({
  email: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
})
type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || searchParams.get('redirect') || '/dashboard/explore'
  const setUserData = useAppStore((s) => s.setUserData)
  const [submitting, setSubmitting] = useState(false)
  const [tosAccepted, setTosAccepted] = useState(false)
  const [cocAccepted, setCocAccepted] = useState(false)
  const [bgImage, setBgImage] = useState<string>(BG_IMAGES[0])

  useEffect(() => {
    setBgImage(BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)])
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const isDisabled = submitting || !tosAccepted || !cocAccepted

  const onSubmit = async (values: LoginFormData) => {
    setSubmitting(true)
    try {
      const result = await loginUser(values.email, values.password)
      if (result.success && result.data) {
        setUserData(result.data.user as Record<string, unknown>)
        router.push(callbackUrl.startsWith('/') ? callbackUrl : '/dashboard/explore')
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
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundImage: `url('/assets/bg/${bgImage}')`,
        backgroundPosition: 'left',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Transparent navbar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          minHeight: '50px',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src="/icons/android-chrome-192x192.png"
            alt="Quote Vote"
            width={25}
            height={25}
            style={{ objectFit: 'contain' }}
          />
        </Link>

        <Link
          href="/auths/request-access"
          style={{
            color: '#ffffff',
            background: '#52b274',
            border: 'none',
            fontWeight: 500,
            fontSize: '13px',
            borderRadius: '5px',
            padding: '10px 15px',
            textDecoration: 'none',
            minWidth: '110px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Get Access
        </Link>
      </div>

      {/* Centered card */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: '40px',
          paddingBottom: '40px',
          paddingLeft: '10px',
          paddingRight: '10px',
          marginTop: '80px',
          position: 'relative',
          zIndex: 3,
        }}
      >
        <div
          style={{
            width: '350px',
            maxWidth: '100%',
            background: '#ffffff',
            borderRadius: '6px',
            boxShadow: '0 1px 4px 0 rgba(0,0,0,0.14)',
            marginBottom: '30px',
            marginTop: '30px',
          }}
        >
          {/* Card body — font-size 0.875rem matches MUI Card base */}
          <div style={{ padding: '0.9375rem 20px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>

              {/* Title */}
              <h1
                style={{
                  fontFamily: 'Montserrat, Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '20px',
                  lineHeight: '24px',
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                Login
              </h1>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                {/* Email / Username */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ position: 'relative' }}>
                    <User
                      style={{
                        position: 'absolute',
                        left: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 16,
                        height: 16,
                        color: '#495057',
                        pointerEvents: 'none',
                      }}
                    />
                    <Input
                      id="email"
                      type="text"
                      placeholder="Email/Username"
                      className="pl-9 md:text-base"
                      style={{ borderColor: errors.email ? '#F55145' : undefined }}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p style={{ color: '#F55145', fontSize: '0.75rem', margin: '4px 0 0' }}>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      style={{
                        position: 'absolute',
                        left: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 16,
                        height: 16,
                        color: '#495057',
                        pointerEvents: 'none',
                      }}
                    />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Password"
                      className="pl-9 md:text-base"
                      style={{ borderColor: errors.password ? '#F55145' : undefined }}
                      {...register('password')}
                    />
                  </div>
                  {errors.password && (
                    <p style={{ color: '#F55145', fontSize: '0.75rem', margin: '4px 0 0' }}>
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* ToS */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <Checkbox
                    id="tos"
                    checked={tosAccepted}
                    onCheckedChange={(v) => setTosAccepted(v === true)}
                    style={{ marginTop: 2 }}
                  />
                  <label htmlFor="tos" style={{ fontSize: '0.875rem', cursor: 'pointer', lineHeight: 1.4 }}>
                    I agree to the{' '}
                    <Link
                      href="https://github.com/QuoteVote/quotevote-monorepo/blob/main/quote_vote_terms_of_service.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#00bcd4', textDecoration: 'underline' }}
                    >
                      Terms of Service
                    </Link>
                  </label>
                </div>

                {/* CoC */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16 }}>
                  <Checkbox
                    id="coc"
                    checked={cocAccepted}
                    onCheckedChange={(v) => setCocAccepted(v === true)}
                    style={{ marginTop: 2 }}
                  />
                  <label htmlFor="coc" style={{ fontSize: '0.875rem', cursor: 'pointer', lineHeight: 1.4 }}>
                    I agree to the{' '}
                    <Link
                      href="https://github.com/QuoteVote/quotevote-monorepo/blob/main/quote_vote_code_of_conduct.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#00bcd4', textDecoration: 'underline' }}
                    >
                      Code of Conduct
                    </Link>
                  </label>
                </div>

                {/* Submit — matches MUI large contained secondary (rose) */}
                <button
                  type="submit"
                  disabled={isDisabled}
                  style={{
                    width: '100%',
                    backgroundColor: isDisabled ? 'rgba(0,0,0,0.12)' : '#E91E63',
                    color: isDisabled ? 'rgba(0,0,0,0.26)' : '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '10px 22px',
                    fontSize: '1rem',
                    fontWeight: 400,
                    lineHeight: 1.5,
                    letterSpacing: '0.00938em',
                    textTransform: 'none' as const,
                    boxShadow: isDisabled
                      ? 'none'
                      : '0 2px 2px 0 rgba(233,30,99,0.14), 0 3px 1px -2px rgba(233,30,99,0.2), 0 1px 5px 0 rgba(233,30,99,0.12)',
                    cursor: isDisabled ? 'default' : 'pointer',
                    pointerEvents: isDisabled ? 'none' : 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontFamily: 'inherit',
                    transition:
                      'background-color 250ms cubic-bezier(0.4,0,0.2,1), box-shadow 250ms cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  {submitting && <Loader2 className="animate-spin" style={{ width: 20, height: 20 }} />}
                  Log in
                </button>
              </form>

              {/* Forgot password */}
              <div style={{ width: '100%', textAlign: 'right' }}>
                <Link
                  href="/auths/forgot-password"
                  style={{ color: '#00bcd4', fontSize: '1rem', textDecoration: 'none' }}
                >
                  Forgot password?
                </Link>
              </div>

              {/* No account */}
              <div style={{ textAlign: 'center', fontSize: '1rem' }}>
                No account?
                <span style={{ marginRight: 5 }} />
                <Link
                  href="/auths/request-access"
                  style={{ color: '#00bcd4', textDecoration: 'none' }}
                >
                  Request Access
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
