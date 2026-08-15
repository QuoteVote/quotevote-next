'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@apollo/client/react'
import { toast } from 'sonner'
import { Loader2, Mail, ChevronLeft } from 'lucide-react'
import { Globe } from '@/components/Icons'
import Link from 'next/link'
import { SEND_PASSWORD_RESET_EMAIL } from '@/graphql/mutations'
import { Input } from '@/components/ui/input'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'

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

const schema = z.object({ email: z.string().email('Invalid email address') })
type FormData = z.infer<typeof schema>

const cardStyle: React.CSSProperties = {
  width: '350px',
  maxWidth: '100%',
  background: '#ffffff',
  borderRadius: '6px',
  boxShadow: '0 1px 4px 0 rgba(0,0,0,0.14)',
  marginBottom: '30px',
  marginTop: '30px',
}

const cardBodyStyle: React.CSSProperties = {
  padding: '0.9375rem 20px',
  fontSize: '0.875rem',
}

const primaryBtnBase: React.CSSProperties = {
  width: '100%',
  border: 'none',
  borderRadius: '4px',
  padding: '10px 22px',
  textTransform: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  fontFamily: 'inherit',
  transition: 'background-color 250ms cubic-bezier(0.4,0,0.2,1), box-shadow 250ms cubic-bezier(0.4,0,0.2,1)',
}

export default function ForgotPasswordPageContent() {
  const router = useRouter()
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [bgImage] = useState<string>(
    () => BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)]
  )
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
      {/* Transparent navbar — matches Auth.jsx layout */}
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
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }} aria-label="Quote.Vote home">
          <Globe size={25} />
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

      {/* Centered card area */}
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
        {sentEmail ? (
          /* ── Email Sent card ── */
          <div style={cardStyle}>
            <div style={cardBodyStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
                <h1
                  style={{
                    fontFamily: 'Montserrat, Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '20px',
                    lineHeight: '24px',
                    margin: 0,
                  }}
                >
                  Email Sent
                </h1>
                <p
                  style={{
                    fontFamily: 'Roboto, Inter, sans-serif',
                    fontWeight: 'normal',
                    fontSize: '16px',
                    lineHeight: '19px',
                    margin: 0,
                  }}
                >
                  We have send you an email to reset your password.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/auths/login')}
                  style={{
                    ...primaryBtnBase,
                    backgroundColor: '#52b274',
                    color: '#ffffff',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    lineHeight: 1.75,
                    letterSpacing: '0.02857em',
                    boxShadow:
                      '0 2px 2px 0 rgba(82,178,116,0.14), 0 3px 1px -2px rgba(82,178,116,0.2), 0 1px 5px 0 rgba(82,178,116,0.12)',
                    cursor: 'pointer',
                  }}
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Forgot Password form card ── */
          <div style={cardStyle}>
            <div style={cardBodyStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>

                {/* Header: back button + title + sub-text */}
                <div style={{ width: '100%', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                      type="button"
                      aria-label="Go Back"
                      onClick={() => router.push('/auths/login')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        marginLeft: '-8px',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'rgba(0,0,0,0.54)',
                        flexShrink: 0,
                      }}
                    >
                      <ChevronLeft style={{ width: 20, height: 20 }} />
                    </button>
                    <span
                      style={{
                        fontFamily: 'Montserrat, Inter, sans-serif',
                        fontWeight: 600,
                        fontSize: '20px',
                        lineHeight: '24px',
                        marginLeft: 25,
                      }}
                    >
                      Forgot password?
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: 'Roboto, Inter, sans-serif',
                      fontWeight: 'normal',
                      fontSize: '16px',
                      lineHeight: '19px',
                      margin: '10px 0 0',
                    }}
                  >
                    We will send you a link to reset your password.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ position: 'relative' }}>
                      <Mail
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
                        type="email"
                        placeholder="Email"
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

                  {/* Send button — MUI large contained primary, cyan text matching monorepo */}
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      ...primaryBtnBase,
                      backgroundColor: submitting ? 'rgba(0,0,0,0.12)' : '#52b274',
                      color: submitting ? 'rgba(0,0,0,0.26)' : '#ffffff',
                      fontSize: '1rem',
                      fontWeight: 400,
                      lineHeight: 1.5,
                      letterSpacing: '0.00938em',
                      boxShadow: submitting
                        ? 'none'
                        : '0 2px 2px 0 rgba(82,178,116,0.14), 0 3px 1px -2px rgba(82,178,116,0.2), 0 1px 5px 0 rgba(82,178,116,0.12)',
                      cursor: submitting ? 'default' : 'pointer',
                      pointerEvents: submitting ? 'none' : 'auto',
                    }}
                  >
                    {submitting && <Loader2 className="animate-spin" style={{ width: 20, height: 20 }} />}
                    Send
                  </button>
                </form>

                {/* Login link */}
                <div style={{ textAlign: 'center', fontSize: '1rem' }}>
                  <Link href="/auths/login" style={{ color: '#00bcd4', textDecoration: 'none' }}>
                    Login
                  </Link>
                </div>

                {/* No account */}
                <div style={{ textAlign: 'center', fontSize: '1rem' }}>
                  No account?
                  <span style={{ marginRight: 5 }} />
                  <Link href="/auths/request-access" style={{ color: '#00bcd4', textDecoration: 'none' }}>
                    Request Access
                  </Link>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
