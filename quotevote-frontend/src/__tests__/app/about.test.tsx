import { render, screen } from '../utils/test-utils'
import AboutPage from '@/app/about/page'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/about',
}))
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt as string} src={props.src as string} />
  ),
}))

describe('AboutPage', () => {
  it('renders about heading', () => {
    render(<AboutPage />)
    expect(screen.getByText(/about quote\.vote/i)).toBeInTheDocument()
  })

  it('renders mission section', () => {
    render(<AboutPage />)
    expect(screen.getByText(/our mission/i)).toBeInTheDocument()
  })

  it('renders how it works section', () => {
    render(<AboutPage />)
    expect(screen.getByText(/how it works/i)).toBeInTheDocument()
  })

  it('renders our values section', () => {
    render(<AboutPage />)
    expect(screen.getByText(/our values/i)).toBeInTheDocument()
  })

  it('renders text-first value', () => {
    render(<AboutPage />)
    expect(screen.getByText('Text-First')).toBeInTheDocument()
  })
})
