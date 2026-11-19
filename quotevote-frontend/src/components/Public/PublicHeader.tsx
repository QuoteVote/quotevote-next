"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/AppShell/Wordmark";
import type { PublicHeaderProps } from "@/types/access";

const DEFAULT_LINKS = [
  { href: "/#feed", label: "Explore" },
  { href: "/#how", label: "How It Works" },
  { href: "/#communities", label: "Communities" },
  { href: "/about", label: "About" },
];

/**
 * The top bar of the public pages: wordmark, section links, Log in and Request Invite.
 * Phones get Request Invite and a menu with the links and Log in.
 */
export function PublicHeader({ links = DEFAULT_LINKS }: PublicHeaderProps) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--pub-header-line)] bg-[var(--pub-header-bg)] backdrop-blur">
      <div className="flex h-16 items-center px-4 sm:px-6 lg:h-[76px] lg:px-12">
        <Wordmark className="text-[22px] lg:text-[26px]" />
        <nav aria-label="Main" className="qv-pub-nav ml-auto flex items-center gap-2 lg:gap-[30px]">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="max-lg:hidden!">
              {link.label}
            </a>
          ))}
          <Link href="/auths/login" className="qv-auth-btn ml-1 max-lg:hidden!">
            Log in
          </Link>
          <Link
            href="/auths/request-access"
            className="qv-auth-btn qv-auth-btn-primary max-lg:h-10! max-lg:px-3.5!"
          >
            Request Invite
          </Link>
          <button
            type="button"
            className="qv-auth-btn qv-auth-btn-ghost size-10! px-0! lg:hidden!"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="public-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </nav>
      </div>
      {open && (
        <nav
          id="public-menu"
          aria-label="Menu"
          className="qv-pub-nav flex flex-col gap-1 border-t border-[var(--pub-header-line)] px-4 py-3 lg:hidden"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-2 py-2.5"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Link href="/auths/login" className="rounded-lg px-2 py-2.5">
            Log in
          </Link>
        </nav>
      )}
    </header>
  );
}
