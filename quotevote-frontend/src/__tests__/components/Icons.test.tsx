/**
 * Icons Component Tests
 * 
 * Tests for all migrated icon components from Material UI to TypeScript.
 * Verifies:
 * - Icons render correctly
 * - Size prop works (number and string)
 * - Color prop works
 * - className prop works
 * - SVG attributes are correct
 * - Default exports work
 */

import { render } from '@testing-library/react'
import {
  Calendar,
  CheckBoxFilled,
  Search,
  Up,
  Down,
  Filter,
  Group,
  Comment,
  Quote,
} from '@/components/Icons'

// Test each icon component
describe('Icon Components', () => {
  describe('Calendar', () => {
    it('renders correctly with default props', () => {
      const { container } = render(<Calendar />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('viewBox', '0 0 37 32')
    })

    it('applies custom size as number', () => {
      const { container } = render(<Calendar size={32} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('width', '32px')
      expect(svg).toHaveAttribute('height', '32px')
    })

    it('applies custom size as string', () => {
      const { container } = render(<Calendar size="2rem" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('width', '2rem')
      expect(svg).toHaveAttribute('height', '2rem')
    })

    it('applies custom color', () => {
      const { container } = render(<Calendar color="#FF0000" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('fill', '#FF0000')
    })

    it('applies custom className', () => {
      const { container } = render(<Calendar className="custom-class" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('custom-class')
    })

    it('uses currentColor as default fill', () => {
      const { container } = render(<Calendar />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'currentColor')
    })
  })

  describe('Search', () => {
    it('renders correctly with default props', () => {
      const { container } = render(<Search />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('viewBox', '0 0 28 30')
    })

    it('applies custom size', () => {
      const { container } = render(<Search size={48} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('width', '48px')
      expect(svg).toHaveAttribute('height', '48px')
    })

    it('applies custom color', () => {
      const { container } = render(<Search color="blue" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'blue')
    })
  })

  describe('Quote', () => {
    it('renders correctly with default props', () => {
      const { container } = render(<Quote />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('viewBox', '0 0 693 605')
    })

    it('applies custom size', () => {
      const { container } = render(<Quote size={40} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('width', '40px')
      expect(svg).toHaveAttribute('height', '40px')
    })

    it('applies custom color', () => {
      const { container } = render(<Quote color="#00FF00" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('fill', '#00FF00')
    })
  })

  describe('Comment', () => {
    it('renders correctly with default props', () => {
      const { container } = render(<Comment />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('viewBox', '0 0 548 598')
    })

    it('applies custom size', () => {
      const { container } = render(<Comment size={36} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('width', '36px')
      expect(svg).toHaveAttribute('height', '36px')
    })

    it('applies custom color', () => {
      const { container } = render(<Comment color="purple" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'purple')
    })
  })

  describe('CheckBoxFilled', () => {
    it('renders correctly with default props', () => {
      const { container } = render(<CheckBoxFilled />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    })

    it('applies custom size', () => {
      const { container } = render(<CheckBoxFilled size={20} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('width', '20px')
      expect(svg).toHaveAttribute('height', '20px')
    })

    it('applies custom color', () => {
      const { container } = render(<CheckBoxFilled color="#0000FF" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('fill', '#0000FF')
    })
  })

  describe('Filter', () => {
    it('renders correctly with default props', () => {
      const { container } = render(<Filter />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('viewBox', '0 0 32 32')
    })

    it('applies custom size', () => {
      const { container } = render(<Filter size={28} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('width', '28px')
      expect(svg).toHaveAttribute('height', '28px')
    })

    it('applies custom color', () => {
      const { container } = render(<Filter color="orange" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'orange')
    })
  })

  describe('Group', () => {
    it('renders correctly with default props', () => {
      const { container } = render(<Group />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('viewBox', '0 0 32 32')
    })

    it('applies custom size', () => {
      const { container } = render(<Group size={30} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('width', '30px')
      expect(svg).toHaveAttribute('height', '30px')
    })

    it('applies custom color', () => {
      const { container } = render(<Group color="teal" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'teal')
    })
  })

  describe('Up', () => {
    it('renders correctly with default props', () => {
      const { container } = render(<Up />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('viewBox', '0 0 368 420')
    })

    it('applies custom size', () => {
      const { container } = render(<Up size={44} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('width', '44px')
      expect(svg).toHaveAttribute('height', '44px')
    })

    it('applies custom color', () => {
      const { container } = render(<Up color="red" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'red')
    })
  })

  describe('Down', () => {
    it('renders correctly with default props', () => {
      const { container } = render(<Down />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('viewBox', '0 0 5400 5630')
    })

    it('applies custom size', () => {
      const { container } = render(<Down size={42} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('width', '42px')
      expect(svg).toHaveAttribute('height', '42px')
    })

    it('applies custom color', () => {
      const { container } = render(<Down color="green" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'green')
    })
  })

  describe('Icon Props Integration', () => {
    it('all icons accept size prop', () => {
      const icons = [
        <Calendar key="calendar" size={32} />,
        <Search key="search" size={32} />,
        <Quote key="quote" size={32} />,
        <Comment key="comment" size={32} />,
        <CheckBoxFilled key="checkbox" size={32} />,
        <Filter key="filter" size={32} />,
        <Group key="group" size={32} />,
        <Up key="up" size={32} />,
        <Down key="down" size={32} />,
      ]

      icons.forEach((icon) => {
        const { container } = render(icon)
        const svg = container.querySelector('svg')
        expect(svg).toHaveAttribute('width', '32px')
        expect(svg).toHaveAttribute('height', '32px')
      })
    })

    it('all icons accept className prop', () => {
      const icons = [
        <Calendar key="calendar" className="test-class" />,
        <Search key="search" className="test-class" />,
        <Quote key="quote" className="test-class" />,
        <Comment key="comment" className="test-class" />,
        <CheckBoxFilled key="checkbox" className="test-class" />,
        <Filter key="filter" className="test-class" />,
        <Group key="group" className="test-class" />,
        <Up key="up" className="test-class" />,
        <Down key="down" className="test-class" />,
      ]

      icons.forEach((icon) => {
        const { container } = render(icon)
        const svg = container.querySelector('svg')
        expect(svg).toHaveClass('test-class')
      })
    })

    it('all icons have inline-block class by default', () => {
      const icons = [
        <Calendar key="calendar" />,
        <Search key="search" />,
        <Quote key="quote" />,
        <Comment key="comment" />,
        <CheckBoxFilled key="checkbox" />,
        <Filter key="filter" />,
        <Group key="group" />,
        <Up key="up" />,
        <Down key="down" />,
      ]

      icons.forEach((icon) => {
        const { container } = render(icon)
        const svg = container.querySelector('svg')
        expect(svg).toHaveClass('inline-block')
      })
    })

    it('all icons have xmlns attribute', () => {
      const icons = [
        <Calendar key="calendar" />,
        <Search key="search" />,
        <Quote key="quote" />,
        <Comment key="comment" />,
        <CheckBoxFilled key="checkbox" />,
        <Filter key="filter" />,
        <Group key="group" />,
        <Up key="up" />,
        <Down key="down" />,
      ]

      icons.forEach((icon) => {
        const { container } = render(icon)
        const svg = container.querySelector('svg')
        expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg')
      })
    })
  })

  describe('Default Size', () => {
    it('all icons default to 24px size', () => {
      const icons = [
        <Calendar key="calendar" />,
        <Search key="search" />,
        <Quote key="quote" />,
        <Comment key="comment" />,
        <CheckBoxFilled key="checkbox" />,
        <Filter key="filter" />,
        <Group key="group" />,
        <Up key="up" />,
        <Down key="down" />,
      ]

      icons.forEach((icon) => {
        const { container } = render(icon)
        const svg = container.querySelector('svg')
        expect(svg).toHaveAttribute('width', '24px')
        expect(svg).toHaveAttribute('height', '24px')
      })
    })
  })

  describe('SVG Path Rendering', () => {
    it('Calendar has path elements', () => {
      const { container } = render(<Calendar />)
      const paths = container.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })

    it('Search has path elements', () => {
      const { container } = render(<Search />)
      const paths = container.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })

    it('Quote has path elements', () => {
      const { container } = render(<Quote />)
      const paths = container.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })

    it('Comment has path elements', () => {
      const { container } = render(<Comment />)
      const paths = container.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })

    it('CheckBoxFilled has path elements', () => {
      const { container } = render(<CheckBoxFilled />)
      const paths = container.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })

    it('Filter has path elements', () => {
      const { container } = render(<Filter />)
      const paths = container.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })

    it('Group has path elements', () => {
      const { container } = render(<Group />)
      const paths = container.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })

    it('Up has path elements', () => {
      const { container } = render(<Up />)
      const paths = container.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })

    it('Down has path elements', () => {
      const { container } = render(<Down />)
      const paths = container.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })
  })
})

