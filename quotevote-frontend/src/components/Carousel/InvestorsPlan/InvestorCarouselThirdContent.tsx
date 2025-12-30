'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useMutation } from '@apollo/client/react'
import Image from 'next/image'
import { useResponsive } from '@/hooks/useResponsive'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SEND_INVESTOR_EMAIL } from '@/graphql/mutations'
import { MOBILE_IMAGE_WIDTH } from './InvestorPlanCarousel'
import type { CarouselContentProps } from '@/types/carousel'

interface InvestorEmailForm {
  email: string
}

export function InvestorCarouselThirdContent({ classes, width }: CarouselContentProps) {
  const router = useRouter()
  const { isMobile } = useResponsive()
  const [sendInvestorMail, { data, error, loading }] = useMutation(SEND_INVESTOR_EMAIL)
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<InvestorEmailForm>()

  const handleSendEmail = async () => {
    const { email } = getValues()
    await sendInvestorMail({ variables: { email } })
  }

  const browserWidth = width === 'md' ? '400.43px' : '435.43px'
  const imageWidth = isMobile ? MOBILE_IMAGE_WIDTH : browserWidth

  useEffect(() => {
    if (data) {
      router.push('/auth/investor-thanks')
    }
  }, [data, router])

  return (
    <form onSubmit={handleSubmit(handleSendEmail)}>
      <div
        className="flex flex-row justify-center items-center"
        style={{
          paddingLeft: width === 'xs' ? 20 : 60,
          paddingRight: width === 'xs' ? 0 : 60,
        }}
      >
        <div className="w-full sm:w-full md:w-2/3 lg:w-7/12">
          <Image
            alt="Investor"
            src="/assets/InvestorContent3.svg"
            width={typeof imageWidth === 'string' ? parseInt(imageWidth) : imageWidth}
            height={isMobile ? 200 : 350}
            className="object-contain"
            style={{
              width: imageWidth,
              height: isMobile ? 'auto' : '350.51px',
            }}
          />
        </div>
        <div className="w-full sm:w-full md:w-1/3 lg:w-5/12">
          <div className={classes?.opinionsText || 'text-base'}>
            <strong>There are 10,000,000 shares of stock</strong>
            <br />
            Join us in creating a truly open and equal community where civil conversation is the main
            objective.
            <br />
            <br />
            <br />
          </div>
          <div className={classes?.sendEmail || 'mt-4'}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={loading || !!error || !!errors.email}
                  className={classes?.sendEmailButton || ''}
                >
                  {loading ? 'Sending...' : 'Send'}
                </Button>
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

