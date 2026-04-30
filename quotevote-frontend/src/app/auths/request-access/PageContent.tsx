'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useApolloClient, useMutation } from '@apollo/client/react'
import { REQUEST_USER_ACCESS_MUTATION } from '@/graphql/mutations'
import { GET_CHECK_DUPLICATE_EMAIL } from '@/graphql/queries'
import { PersonalForm } from '@/components/RequestAccess/PersonalForm/PersonalForm'
import Link from 'next/link'
import Image from 'next/image'

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

export function RequestAccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const wasRedirected = !!searchParams.get('from')

  const client = useApolloClient()
  const [requestAccess, { loading }] = useMutation(REQUEST_USER_ACCESS_MUTATION)

  const [bgImage, setBgImage] = useState<string | null>(null)
  const [userDetails, setUserDetails] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [requestInviteSuccessful, setRequestInviteSuccessful] = useState(false)

  useEffect(() => {
    const idx = Math.floor(Math.random() * BG_IMAGES.length)
    setBgImage(BG_IMAGES[idx])
  }, [])

  const onSubmit = async () => {
    setErrorMessage('')

    const pattern =
      /^(("[\w\-+\s]+")([\w\-+]+(?:\.[\w\-+]+)*)|("[\w\-+\s]+")([\w\-+]+(?:\.[\w\-+]+)*)|[\w\-+]+(?:\.[\w\-+]+)*)(@((?:[\w\-+]+\.)*\w[\w\-+]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4]\d\.|1\d{2}\.|[\d]{1,2}\.))((25[0-5]|2[0-4]\d|1\d{2}|[\d]{1,2})\.){2}(25[0-5]|2[0-4]\d|1\d{2}|[\d]{1,2})\]?$)/i
    if (!pattern.test(userDetails)) {
      setErrorMessage('This is not a valid email address')
      return
    }

    try {
      const { data } = await client.query({
        query: GET_CHECK_DUPLICATE_EMAIL,
        variables: { email: userDetails },
        fetchPolicy: 'network-only',
      })
      const hasDuplicate =
        ((data as { checkDuplicateEmail?: unknown[] })?.checkDuplicateEmail?.length ?? 0) > 0
      if (hasDuplicate) {
        setErrorMessage('This email already exists')
        return
      }

      await requestAccess({
        variables: { requestUserAccessInput: { email: userDetails } },
      })
      setRequestInviteSuccessful(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('email: Path `email` is required.')) {
        setErrorMessage('Email is required')
      } else {
        setErrorMessage('An unexpected error occurred. Please try again later.')
      }
    }
  }

  if (requestInviteSuccessful) {
    return <PersonalForm requestInviteSuccessful={true} />
  }

  return (
    <div
      style={{
        minWidth: '100%',
        minHeight: '100vh',
        backgroundImage: bgImage
          ? `url('/assets/bg/${bgImage}')`
          : `url('/assets/Mountain.png')`,
        backgroundPosition: 'left',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        color: 'white',
        padding: '0 0 40px 0',
      }}
    >
      {/* Header: Logo icon (left) | Go back + Login (right) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0 24px',
          height: 64,
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Image src="/icons/android-chrome-192x192.png" alt="Quote.Vote" width={32} height={32} />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button
            onClick={() => router.back()}
            style={{
              color: 'white',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: 0,
            }}
          >
            Go back
          </button>

          <Link href="/auths/login" style={{ color: 'white', fontSize: '1rem', textDecoration: 'none' }}>
            Login
          </Link>
        </div>
      </div>

      {/* QUOTE.VOTE title in body, centered above the form */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <span
          style={{
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.12em',
            fontFamily: 'Montserrat, Inter, sans-serif',
            textTransform: 'uppercase',
            WebkitTextStroke: '1.5px black',
            paintOrder: 'stroke fill',
          }}
        >
          Quote<span style={{ WebkitTextStroke: '1.5px black' }}>.</span>Vote
        </span>
      </div>

      {/* Redirect notice */}
      {wasRedirected && (
        <div
          style={{
            position: 'relative',
            width: '70%',
            padding: '16px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.45)',
              zIndex: 1,
              borderRadius: 8,
            }}
          />
          <div style={{ position: 'relative', zIndex: 2, padding: '16px', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#fff' }}>
              You need an account to contribute. Viewing is public, but posting, voting, and
              quoting require an invite.
            </p>
          </div>
        </div>
      )}

      {/* Email + Button row */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <input
          type="email"
          placeholder="Enter Email"
          value={userDetails}
          onChange={(e) => setUserDetails(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          style={{
            backgroundColor: 'white',
            borderRadius: 5,
            height: 45,
            width: 250,
            marginRight: 20,
            paddingLeft: 20,
            border: 'none',
            outline: 'none',
            fontSize: 16,
            color: '#333',
          }}
        />
        <button
          onClick={onSubmit}
          disabled={loading}
          style={{
            textTransform: 'none',
            backgroundColor: '#00cf6e',
            color: 'white',
            width: 200,
            height: 45,
            fontSize: 16,
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.8 : 1,
          }}
        >
          {loading ? 'Submitting...' : 'Request Invite'}
        </button>
      </div>

      {/* Error message */}
      {errorMessage && (
        <p style={{ color: '#fff', margin: '4px 0 12px', fontSize: 14 }}>{errorMessage}</p>
      )}

      {/* Two-column info overlay */}
      <div
        style={{
          position: 'relative',
          width: '70%',
          padding: '16px',
          marginTop: '3rem',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.45)',
            zIndex: 1,
            borderRadius: 8,
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Column 1 */}
          <div>
            <h5 style={{ textAlign: 'center', marginTop: 0, marginBottom: 12, fontSize: '1.25rem' }}>
              No Ads, No Algorithms
            </h5>
            <p style={{ textAlign: 'left', margin: '0 0 8px', fontSize: '0.875rem', lineHeight: 1.5 }}>
              There is no ranking, boosting, or personalization engine. You can&apos;t pay to be
              seen. Users seek to find quotes.
            </p>
            <p style={{ textAlign: 'left', margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}>
              Discovery is deliberate. Feeds are chronological. An experience of hunting and
              discovery, not passive scrolling.
            </p>
          </div>

          {/* Column 2 */}
          <div>
            <h5 style={{ textAlign: 'center', marginTop: 0, marginBottom: 12, fontSize: '1.25rem' }}>
              Open Source, Non Profit
            </h5>
            <p style={{ textAlign: 'left', margin: '0 0 8px', fontSize: '0.875rem', lineHeight: 1.5 }}>
              The platform is non-profit, open source, and donation-supported. You can&apos;t pay
              to be seen.
            </p>
            <p style={{ textAlign: 'left', margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}>
              The only economic model is when users like what they experience, and give money via
              donations.
            </p>
          </div>
        </div>
      </div>

      {/* Read Our Mission */}
      <button
        onClick={() => {
          window.location.hash = 'mission'
          document.getElementById('mission')?.scrollIntoView({ behavior: 'smooth' })
        }}
        style={{
          marginTop: '2rem',
          display: 'block',
          textTransform: 'none',
          backgroundColor: '#00cf6e',
          color: 'white',
          width: 200,
          height: 45,
          fontSize: 16,
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        Read Our Mission
      </button>
    </div>
  )
}
