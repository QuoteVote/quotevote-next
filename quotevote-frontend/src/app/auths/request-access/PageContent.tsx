'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useApolloClient, useMutation } from '@apollo/client/react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { REQUEST_USER_ACCESS_MUTATION } from '@/graphql/mutations'
import { GET_CHECK_DUPLICATE_EMAIL } from '@/graphql/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Step = 'plan' | 'personal' | 'business' | 'payment'
type PlanType = 'personal' | 'business'

const personalSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
})
const businessSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  companyName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
})

type PersonalData = z.infer<typeof personalSchema>
type BusinessData = z.infer<typeof businessSchema>

function StepIndicator({ step }: { step: Step }) {
  const steps: Step[] = ['plan', 'personal', 'payment']
  const current = steps.indexOf(step === 'business' ? 'personal' : step)
  return (
    <div className="flex justify-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`h-2 w-8 rounded-full ${i <= current ? 'bg-primary' : 'bg-muted'}`}
        />
      ))}
    </div>
  )
}

function PlanStep({ onSelect }: { onSelect: (type: PlanType) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-center">Choose a Plan</h2>
      <div className="grid gap-3">
        {(['personal', 'business'] as const).map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="p-4 rounded-lg border border-border bg-card text-left hover:border-primary hover:bg-primary/5 transition-colors capitalize font-medium"
          >
            {type} Plan
          </button>
        ))}
        <button
          onClick={() => onSelect('personal')}
          className="p-4 rounded-lg border border-border bg-card text-left hover:border-primary hover:bg-primary/5 transition-colors font-medium"
        >
          Investors
        </button>
      </div>
    </div>
  )
}

function PersonalFormStep({
  onBack,
  onNext,
}: {
  onBack: () => void
  onNext: (data: PersonalData) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PersonalData>({ resolver: zodResolver(personalSchema) })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Personal Information</h2>
      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input {...register('firstName')} />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input {...register('lastName')} />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          Continue
        </Button>
      </form>
      <button
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
      >
        ← Back
      </button>
    </div>
  )
}

function BusinessFormStep({
  onBack,
  onNext,
}: {
  onBack: () => void
  onNext: (data: BusinessData) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BusinessData>({ resolver: zodResolver(businessSchema) })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Business Information</h2>
      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input {...register('fullName')} />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Company Name</Label>
          <Input {...register('companyName')} />
          {errors.companyName && (
            <p className="text-sm text-destructive">{errors.companyName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          Continue
        </Button>
      </form>
      <button
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
      >
        ← Back
      </button>
    </div>
  )
}

function PaymentStep({
  onBack,
  onSubmit: onFinalSubmit,
  loading,
  errorMessage,
}: {
  onBack: () => void
  onSubmit: () => void
  loading: boolean
  errorMessage: string
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Payment</h2>
      <p className="text-muted-foreground text-sm">
        Payment will not be charged until your invite is sent.
      </p>
      <div className="p-4 rounded-lg border border-border bg-muted/50">
        <p className="text-sm text-muted-foreground">
          Credit card input (Stripe — wired in Phase 5)
        </p>
      </div>
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
      <Button className="w-full" onClick={onFinalSubmit} disabled={loading}>
        {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
        Submit Request
      </Button>
      <button
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
      >
        ← Back
      </button>
    </div>
  )
}

function SuccessView({ planType }: { planType: PlanType }) {
  const router = useRouter()
  return (
    <div className="text-center space-y-6 py-4">
      <h2 className="text-2xl font-bold">
        Thank you for <span className="text-primary">joining us</span>
      </h2>
      <p className="text-muted-foreground leading-relaxed">
        {planType === 'business'
          ? 'You selected the Business Plan, and we are excited to talk with you. When an account becomes available, an invite will be sent to the email address you provided.'
          : 'When an account becomes available, an invite will be sent to the email address you provided.'}
      </p>
      <Button onClick={() => router.push('/')} variant="outline" className="mt-4">
        Back to Home
      </Button>
    </div>
  )
}

export function RequestAccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const step = (searchParams.get('step') ?? 'plan') as Step

  const client = useApolloClient()
  const [requestAccess, { loading }] = useMutation(REQUEST_USER_ACCESS_MUTATION)

  const [formData, setFormData] = useState<{ email?: string; planType?: PlanType }>({})
  const [errorMessage, setErrorMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const goToStep = (s: Step) => router.push(`?step=${s}`)

  const handlePlanSelect = (type: PlanType) => {
    setFormData((prev) => ({ ...prev, planType: type }))
    goToStep(type)
  }

  const handlePersonalNext = (data: PersonalData) => {
    setFormData((prev) => ({ ...prev, email: data.email, planType: 'personal' }))
    goToStep('payment')
  }

  const handleBusinessNext = (data: BusinessData) => {
    setFormData((prev) => ({ ...prev, email: data.email, planType: 'business' }))
    goToStep('payment')
  }

  const handleFinalSubmit = async () => {
    setErrorMessage('')
    const email = formData.email ?? ''

    try {
      // Check for duplicate email before submitting — matches monorepo behaviour
      const { data } = await client.query({
        query: GET_CHECK_DUPLICATE_EMAIL,
        variables: { email },
        fetchPolicy: 'network-only',
      })
      const hasDuplicate =
        ((data as { checkDuplicateEmail?: unknown[] })?.checkDuplicateEmail?.length ?? 0) > 0
      if (hasDuplicate) {
        setErrorMessage('This email address has already been used to request an invite.')
        return
      }

      await requestAccess({
        variables: { requestUserAccessInput: { email } },
      })
      setSuccess(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed'
      if (message.includes('email: Path `email` is required.')) {
        setErrorMessage('Email is required')
      } else {
        setErrorMessage('An unexpected error occurred. Please try again later.')
      }
    }
  }

  if (success) {
    return <SuccessView planType={formData.planType ?? 'personal'} />
  }

  return (
    <div>
      <StepIndicator step={step} />
      {step === 'plan' && <PlanStep onSelect={handlePlanSelect} />}
      {step === 'personal' && (
        <PersonalFormStep onBack={() => goToStep('plan')} onNext={handlePersonalNext} />
      )}
      {step === 'business' && (
        <BusinessFormStep onBack={() => goToStep('plan')} onNext={handleBusinessNext} />
      )}
      {step === 'payment' && (
        <PaymentStep
          onBack={() => goToStep(formData.planType ?? 'personal')}
          onSubmit={handleFinalSubmit}
          loading={loading}
          errorMessage={errorMessage}
        />
      )}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link href="/auths/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
