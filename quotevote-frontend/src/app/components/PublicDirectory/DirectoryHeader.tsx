'use client'

import { useState, type ReactElement } from 'react'
import Link from 'next/link'
import { Github, Menu } from 'lucide-react'
import { Globe } from '@/components/Icons'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

/**
 * Compact guest header for the public post directory (#454).
 * Logo, About, Request Invite, and a menu for remaining links.
 */
export function DirectoryHeader(): ReactElement {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header
        className="md:sticky md:top-0 md:z-50 w-full max-w-[100vw] min-w-0 bg-gradient-to-br from-white to-gray-50 border-b-2 border-transparent bg-clip-padding"
        role="navigation"
        aria-label="Main navigation"
        style={{ borderImage: 'linear-gradient(90deg, #2AE6B2, #27C4E1, #178BE1) 1' }}
      >
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 min-w-0 shrink-0 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] rounded-lg"
            aria-label="Quote.Vote home"
          >
            <Globe size={28} className="size-7" />
            <span
              className="font-extrabold text-lg tracking-wide hidden sm:block select-none"
              style={{ color: '#0A2342' }}
            >
              Quote.Vote
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <Link
              href="/about"
              className="px-2 sm:px-3 py-2 text-sm font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]"
              style={{ color: '#475569' }}
            >
              About
            </Link>

            <Link
              href="/auths/request-access"
              className="px-3 sm:px-4 py-1.5 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2AE6B2] focus-visible:ring-offset-2"
              style={{
                background: 'linear-gradient(135deg, #2AE6B2 0%, #27C4E1 100%)',
                boxShadow: '0 2px 12px rgba(42,230,178,0.25)',
              }}
              aria-label="Request an invite to join Quote.Vote"
            >
              Request Invite
            </Link>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="text-[#0A2342] shrink-0"
            >
              <Menu className="size-6" />
            </Button>
          </div>
        </div>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-80 p-6">
          <SheetHeader>
            <SheetTitle className="text-[#0A2342] font-bold text-lg">Menu</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 flex flex-col gap-3" aria-label="Directory menu">
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/auths/login" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
            </Button>
            <Button variant="ghost" asChild className="w-full justify-start">
              <a
                href="https://opencollective.com/quotevote/donate"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
              >
                Donate
              </a>
            </Button>
            <Button variant="ghost" asChild className="w-full justify-start">
              <a
                href="https://github.com/QuoteVote/quotevote-next"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
              >
                <Github className="size-4" />
                GitHub
              </a>
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
