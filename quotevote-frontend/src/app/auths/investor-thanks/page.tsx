import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Thank You — Quote.Vote',
  description: 'Thank you for your interest in investing with Quote.Vote',
}

export default function InvestorThanksPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-lg text-center space-y-6">
        <Image
          src="/icons/android-chrome-192x192.png"
          alt="Quote.Vote"
          width={64}
          height={64}
          className="mx-auto"
        />
        <h1 className="text-3xl font-bold">
          We Will Be{' '}
          <span className="text-primary">in Touch!</span>
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          We will send updates as we seek legal guidance to plan our funding rounds.
        </p>
        <p className="text-sm font-semibold">
          Please check your inbox for an email confirming you are on our mailing list.
        </p>
        <Link
          href="/"
          className="inline-block text-primary hover:underline font-medium"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
