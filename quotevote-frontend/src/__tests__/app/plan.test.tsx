import { render, screen } from '../utils/test-utils'
import { PlanPageContent } from '@/app/plan/PlanPageContent'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))
jest.mock('sonner', () => ({ toast: { error: jest.fn() } }))

// Mock carousel components
jest.mock('@/components/Carousel/PersonalPlan/PersonalPlanCarousel', () => ({
  PersonalPlanCarousel: () => <div data-testid="personal-carousel">Personal Plan</div>,
}))
jest.mock('@/components/Carousel/BusinessPlan/BusinessPlanCarousel', () => ({
  BusinessPlanCarousel: () => <div data-testid="business-carousel">Business Plan</div>,
}))
jest.mock('@/components/Carousel/InvestorsPlan/InvestorPlanCarousel', () => ({
  InvestorPlanCarousel: () => <div data-testid="investor-carousel">Investor Plan</div>,
}))

describe('PlanPageContent', () => {
  it('renders tabs', () => {
    render(<PlanPageContent />)
    expect(screen.getByRole('tab', { name: /personal/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /business/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /investors/i })).toBeInTheDocument()
  })

  it('renders heading', () => {
    render(<PlanPageContent />)
    expect(screen.getByText(/choose your plan/i)).toBeInTheDocument()
  })

  it('shows personal carousel by default', () => {
    render(<PlanPageContent />)
    expect(screen.getByTestId('personal-carousel')).toBeInTheDocument()
  })
})
