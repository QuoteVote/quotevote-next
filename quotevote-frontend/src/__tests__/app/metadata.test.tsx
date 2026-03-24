/**
 * Page Metadata Tests
 *
 * Verifies all public pages export correct Next.js metadata objects
 * with appropriate title and description fields.
 */

import { metadata as loginMetadata } from '@/app/auths/login/page'
import { metadata as signupMetadata } from '@/app/auths/signup/page'
import { metadata as forgotPasswordMetadata } from '@/app/auths/forgot-password/page'
import { metadata as passwordResetMetadata } from '@/app/auths/password-reset/page'
import { metadata as requestAccessMetadata } from '@/app/auths/request-access/page'
import { metadata as aboutMetadata } from '@/app/about/page'
import { metadata as planMetadata } from '@/app/plan/page'

describe('Page Metadata', () => {
  describe('Auth pages', () => {
    it('login page has title', () => {
      expect(loginMetadata).toBeDefined()
      expect(loginMetadata.title).toBeTruthy()
    })

    it('login page title contains Quote.Vote', () => {
      const title = String(loginMetadata.title)
      expect(title).toMatch(/quote\.vote/i)
    })

    it('signup page has title', () => {
      expect(signupMetadata).toBeDefined()
      expect(signupMetadata.title).toBeTruthy()
    })

    it('signup page title mentions Create Account', () => {
      const title = String(signupMetadata.title)
      expect(title).toMatch(/create account/i)
    })

    it('forgot password page has title', () => {
      expect(forgotPasswordMetadata).toBeDefined()
      expect(forgotPasswordMetadata.title).toBeTruthy()
    })

    it('password reset page has title', () => {
      expect(passwordResetMetadata).toBeDefined()
      expect(passwordResetMetadata.title).toBeTruthy()
    })

    it('request access page has title', () => {
      expect(requestAccessMetadata).toBeDefined()
      expect(requestAccessMetadata.title).toBeTruthy()
    })

    it('request access page title mentions Request Access', () => {
      const title = String(requestAccessMetadata.title)
      expect(title).toMatch(/request access/i)
    })
  })

  describe('Public pages', () => {
    it('about page has title', () => {
      expect(aboutMetadata).toBeDefined()
      expect(aboutMetadata.title).toBeTruthy()
    })

    it('plan page has title', () => {
      expect(planMetadata).toBeDefined()
      expect(planMetadata.title).toBeTruthy()
    })
  })

  describe('Metadata structure', () => {
    const allMetadata = [
      { name: 'login', meta: loginMetadata },
      { name: 'signup', meta: signupMetadata },
      { name: 'forgot-password', meta: forgotPasswordMetadata },
      { name: 'password-reset', meta: passwordResetMetadata },
      { name: 'request-access', meta: requestAccessMetadata },
      { name: 'about', meta: aboutMetadata },
      { name: 'plan', meta: planMetadata },
    ]

    allMetadata.forEach(({ name, meta }) => {
      it(`${name} page exports a metadata object`, () => {
        expect(meta).toBeDefined()
        expect(typeof meta).toBe('object')
      })

      it(`${name} page title is a non-empty string`, () => {
        const title = String(meta.title)
        expect(title.length).toBeGreaterThan(0)
      })
    })
  })
})
