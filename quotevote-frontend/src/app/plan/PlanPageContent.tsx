'use client'

import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client/react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { PersonalPlanCarousel } from '@/components/Carousel/PersonalPlan/PersonalPlanCarousel'
import { BusinessPlanCarousel } from '@/components/Carousel/BusinessPlan/BusinessPlanCarousel'
import { InvestorPlanCarousel } from '@/components/Carousel/InvestorsPlan/InvestorPlanCarousel'
import { SEND_INVESTOR_EMAIL } from '@/graphql/mutations'
import { replaceGqlError } from '@/lib/utils/replaceGqlError'

export function PlanPageContent() {
  const router = useRouter()
  const [sendInvestorEmail] = useMutation(SEND_INVESTOR_EMAIL)

  const handleContactUs = async () => {
    try {
      await sendInvestorEmail({ variables: { email: '' } })
      router.push('/auths/investor-thanks')
    } catch (error) {
      toast.error(
        replaceGqlError(error instanceof Error ? error.message : 'Failed to send email')
      )
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Choose Your Plan</h1>
        <p className="text-muted-foreground">Select the plan that fits your needs.</p>
      </div>
      <Tabs defaultValue="personal">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
        </TabsList>
        <TabsContent value="personal">
          <PersonalPlanCarousel />
        </TabsContent>
        <TabsContent value="business">
          <BusinessPlanCarousel />
        </TabsContent>
        <TabsContent value="investors">
          <InvestorPlanCarousel />
          <div className="text-center mt-8">
            <Button onClick={handleContactUs} size="lg">
              Contact Us
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
