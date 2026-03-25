'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@apollo/client/react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { REQUEST_USER_ACCESS_MUTATION } from '@/graphql/mutations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'

type Step = 'plan' | 'personal' | 'business' | 'payment'

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

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
      {label}
    </Button>
  )
}

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

function PlanStep({ onSelect }: { onSelect: (type: 'personal' | 'business') => void }) {
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
    formState: { errors },
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
        <SubmitButton label="Continue" />
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
    formState: { errors },
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
        <SubmitButton label="Continue" />
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
}: {
  email: string
  onBack: () => void
  onSubmit: () => void
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
      <Button className="w-full" onClick={onFinalSubmit}>
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

export function RequestAccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const step = (searchParams.get('step') ?? 'plan') as Step
  const [requestAccess] = useMutation(REQUEST_USER_ACCESS_MUTATION)
  const [formData, setFormData] = useState<{ email?: string }>({})

  const goToStep = (s: Step) => router.push(`?step=${s}`)

  const handlePlanSelect = (type: 'personal' | 'business') => goToStep(type)

  const handlePersonalNext = (data: PersonalData) => {
    setFormData({ email: data.email })
    goToStep('payment')
  }

  const handleBusinessNext = (data: BusinessData) => {
    setFormData({ email: data.email })
    goToStep('payment')
  }

  const handleFinalSubmit = async () => {
    try {
      await requestAccess({
        variables: { requestUserAccessInput: { email: formData.email ?? '' } },
      })
      toast.success('Request submitted! We will be in touch.')
      router.push('/')
    } catch (error) {
      toast.error(replaceGqlError(error instanceof Error ? error.message : 'Request failed'))
    }
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
          email={formData.email ?? ''}
          onBack={() => goToStep('personal')}
          onSubmit={handleFinalSubmit}
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
