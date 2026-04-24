/**
 * PresenceIcon Component Tests
 *
 * Tests for the PresenceIcon component including:
 * - Rendering the correct colour class for each status
 * - Handling unknown/undefined status gracefully (fallback to offline)
 * - Applying extra className prop
 * - aria-hidden attribute for accessibility
 */

import { render } from '@/__tests__/utils/test-utils'
import PresenceIcon from '@/components/Chat/PresenceIcon'

type PresenceStatus = 'online' | 'away' | 'dnd' | 'offline' | 'invisible';

// Helper: grab the rendered <span> from the container
const getIcon = (container: HTMLElement) =>
  container.querySelector('span[aria-hidden="true"]') as HTMLElement

describe('PresenceIcon', () => {
  // ── Status colour classes ───────────────────────────────────────────────

  it('applies emerald (green) class for "online" status', () => {
    const { container } = render(<PresenceIcon status="online" />)
    const icon = getIcon(container)
    expect(icon).toBeInTheDocument()
    expect(icon.className).toContain('bg-[#52b274]')
  })

  it('applies amber (yellow) class for "away" status', () => {
    const { container } = render(<PresenceIcon status="away" />)
    const icon = getIcon(container)
    expect(icon.className).toContain('bg-amber-400')
  })

  it('applies red class for "dnd" status', () => {
    const { container } = render(<PresenceIcon status="dnd" />)
    const icon = getIcon(container)
    expect(icon.className).toContain('bg-red-500')
  })

  it('applies zinc (grey) class for "offline" status', () => {
    const { container } = render(<PresenceIcon status="offline" />)
    const icon = getIcon(container)
    expect(icon.className).toContain('bg-zinc-500')
  })

  it('applies zinc (grey) class for "invisible" status', () => {
    const { container } = render(<PresenceIcon status="invisible" />)
    const icon = getIcon(container)
    expect(icon.className).toContain('bg-zinc-500')
  })

  // ── Unknown / edge-case status ──────────────────────────────────────────

  it('falls back to offline styling for unknown status value', () => {
    const { container } = render(
      <PresenceIcon status={'unknown_status' as PresenceStatus} />
    )
    const icon = getIcon(container)
    // Fallback should still render and use offline class
    expect(icon).toBeInTheDocument()
    expect(icon.className).toContain('bg-zinc-500')
  })

  // ── className prop ──────────────────────────────────────────────────────

  it('appends extra className when provided', () => {
    const { container } = render(
      <PresenceIcon status="online" className="my-extra-class" />
    )
    const icon = getIcon(container)
    expect(icon.className).toContain('my-extra-class')
  })

  it('does not add undefined/null to className string when className is omitted', () => {
    const { container } = render(<PresenceIcon status="online" />)
    const icon = getIcon(container)
    // Should not contain the literal string "undefined" or "null"
    expect(icon.className).not.toContain('undefined')
    expect(icon.className).not.toContain('null')
  })

  // ── Accessibility ───────────────────────────────────────────────────────

  it('has aria-hidden="true" so screen readers skip the decorative icon', () => {
    const { container } = render(<PresenceIcon status="online" />)
    const icon = getIcon(container)
    expect(icon.getAttribute('aria-hidden')).toBe('true')
  })

  // ── Shape / size classes ────────────────────────────────────────────────

  it('renders a small rounded circle (h-3 w-3 rounded-full)', () => {
    const { container } = render(<PresenceIcon status="online" />)
    const icon = getIcon(container)
    expect(icon.className).toContain('h-3')
    expect(icon.className).toContain('w-3')
    expect(icon.className).toContain('rounded-full')
  })

  // ── All statuses snapshot-style check ──────────────────────────────────

  const statuses: PresenceStatus[] = ['online', 'away', 'dnd', 'offline', 'invisible']

  statuses.forEach((status) => {
    it(`renders without crashing for status "${status}"`, () => {
      const { container } = render(<PresenceIcon status={status} />)
      expect(getIcon(container)).toBeInTheDocument()
    })
  })
})
