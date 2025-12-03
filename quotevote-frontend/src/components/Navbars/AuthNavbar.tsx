'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, UserPlus, Fingerprint, Lock } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { AuthNavbarProps, NavItem } from '@/types/components';

// Logo color palette (for reference)
// teal: '#2AE6B2', aqua: '#27C4E1', cyan: '#178BE1', navy: '#0A2342', overlay: 'rgba(14, 17, 22, 0.06)'

/**
 * AuthNavbar Component
 * 
 * Navigation bar for authentication pages.
 * Shows navigation links for Register, Login, and Lock Screen.
 * Uses shadcn/ui components and Tailwind CSS for styling.
 */
export function AuthNavbar({ color, brandText = 'QuoteVote' }: AuthNavbarProps) {
  const pathname = usePathname();
  const { isMediumScreen } = useResponsive();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen((prev) => !prev);
  };

  const activeRoute = (routeName: string) => pathname.includes(routeName);

  const navigationItems: NavItem[] = [
    {
      name: 'Register',
      href: '/auth/register-page',
      icon: UserPlus,
      showInMobile: true,
    },
    {
      name: 'Login',
      href: '/auth/login',
      icon: Fingerprint,
      showInMobile: true,
    },
    {
      name: 'Lock',
      href: '/auth/lock-screen-page',
      icon: Lock,
      showInMobile: true,
    },
  ];

  // Desktop navigation list
  const desktopList = (
    <nav className="flex items-center gap-1 m-0 p-0">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeRoute(item.href);
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg no-underline text-[#0A2342] font-medium text-sm transition-all relative overflow-hidden',
              'hover:bg-[rgba(14,17,22,0.06)] hover:text-[#178BE1] hover:-translate-y-0.5',
              isActive
                ? 'bg-gradient-to-br from-[#2AE6B2] to-[#27C4E1] text-white hover:from-[#27C4E1] hover:to-[#178BE1] hover:text-white'
                : ''
            )}
          >
            {Icon && <Icon className="size-4" />}
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  // Mobile navigation list
  const mobileList = (
    <div className="flex flex-col">
      {/* Brand header in mobile menu */}
      <div className="p-4 border-b-2 border-transparent bg-clip-padding" style={{ borderImage: 'linear-gradient(90deg, #2AE6B2, #27C4E1) 1' }}>
        <div className="flex items-center justify-center w-full">
          <Image
            alt="QuoteVote"
            src="/icons/android-chrome-192x192.png"
            width={32}
            height={32}
            className="mr-3 transition-transform hover:scale-105"
          />
          <h6 className="font-semibold text-[#0A2342] text-xl m-0">{brandText}</h6>
        </div>
      </div>

      <div className="h-0.5 bg-gradient-to-r from-[#2AE6B2] to-[#27C4E1] my-0" />

      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeRoute(item.href);
        if (!item.showInMobile) return null;

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={handleDrawerToggle}
            className={cn(
              'flex items-center gap-2 mx-2 my-1 px-4 py-3 rounded-lg no-underline transition-all',
              isActive
                ? 'bg-gradient-to-br from-[#2AE6B2] to-[#27C4E1] text-white hover:from-[#27C4E1] hover:to-[#178BE1]'
                : 'text-[#0A2342] font-medium hover:bg-[rgba(14,17,22,0.06)] hover:text-[#178BE1] hover:-translate-y-0.5'
            )}
          >
            {Icon && <Icon className="size-5" />}
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <header
      className={cn(
        'bg-white bg-gradient-to-br from-white to-gray-50 shadow-[0_2px_12px_rgba(0,0,0,0.08)] border-b-2 border-transparent bg-clip-padding',
        color && `navbar-${color}`
      )}
      style={{ borderImage: 'linear-gradient(90deg, #2AE6B2, #27C4E1, #178BE1) 1' }}
    >
      <div className="min-h-[70px] flex items-center justify-between px-6 md:px-12">
        {/* Brand Section */}
        {isMediumScreen ? (
          <div className="flex items-center gap-4">
            <Link href="/" className="no-underline">
              <Image
                alt="QuoteVote"
                src="/icons/android-chrome-192x192.png"
                width={32}
                height={32}
                className="transition-transform hover:scale-105"
              />
            </Link>
            <Button variant="ghost" className="p-0 h-auto cursor-default">
              <h6 className="font-semibold text-[#0A2342] text-xl m-0">{brandText}</h6>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="p-0 h-auto cursor-default">
              <h6 className="font-semibold text-[#0A2342] text-xl m-0">QuoteVote</h6>
            </Button>
          </div>
        )}

        {/* Desktop Navigation */}
        {isMediumScreen && (
          <div className="flex items-center flex-grow justify-end">
            {desktopList}
          </div>
        )}

        {/* Mobile Menu Button */}
        {!isMediumScreen && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleDrawerToggle}
            aria-label="open drawer"
            className="text-[#0A2342] border-[#2AE6B2] rounded-md hover:bg-[rgba(14,17,22,0.06)] hover:border-[#27C4E1] transition-colors"
          >
            <Menu className="size-5" />
          </Button>
        )}
      </div>

      {/* Mobile Drawer */}
      {!isMediumScreen && (
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="right" className="w-70 bg-gradient-to-br from-white to-gray-50">
            {mobileList}
          </SheetContent>
        </Sheet>
      )}
    </header>
  );
}

