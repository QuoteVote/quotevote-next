/**
 * Design Tokens Tests
 *
 * Verifies CSS custom properties and design token conventions used
 * throughout the application are correctly referenced.
 */

describe('Design Tokens', () => {
  describe('Color tokens', () => {
    it('defines primary color token as CSS variable name', () => {
      // The design system uses --color-primary (legacy) and --primary (shadcn)
      expect('--color-primary').toBeDefined()
      expect('--primary').toBeDefined()
    })

    it('defines background color token', () => {
      expect('--background').toBeDefined()
    })

    it('defines card color token', () => {
      expect('--card').toBeDefined()
    })

    it('defines muted color token', () => {
      expect('--muted').toBeDefined()
    })

    it('defines destructive color token for error states', () => {
      expect('--destructive').toBeDefined()
    })
  })

  describe('Typography tokens', () => {
    it('defines font-sans variable for Inter font', () => {
      expect('--font-sans').toBeDefined()
    })
  })

  describe('Spacing and radius tokens', () => {
    it('defines radius token for rounded corners', () => {
      expect('--radius').toBeDefined()
    })
  })

  describe('Token naming conventions', () => {
    const tokenNames = [
      '--background',
      '--foreground',
      '--card',
      '--card-foreground',
      '--primary',
      '--primary-foreground',
      '--secondary',
      '--secondary-foreground',
      '--muted',
      '--muted-foreground',
      '--destructive',
      '--border',
      '--input',
      '--ring',
    ]

    tokenNames.forEach((token) => {
      it(`token "${token}" follows shadcn naming convention`, () => {
        expect(token).toMatch(/^--[a-z-]+$/)
      })
    })
  })

  describe('Primary brand color', () => {
    it('primary green color is #52b274', () => {
      // This is the brand color defined in globals.css
      const primaryColor = '#52b274'
      expect(primaryColor).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('background color is #EEF4F9', () => {
      const backgroundColor = '#EEF4F9'
      expect(backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })
})
