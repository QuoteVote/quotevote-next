'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, Github } from 'lucide-react';
import { getApolloClient } from '@/lib/apollo';
import { useAppStore } from '@/store';
import { useResponsive } from '@/hooks/useResponsive';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar } from '@/components/Avatar';
import { AdminIconButton } from '../CustomButtons/AdminIconButton';
import { SettingsIconButton } from '../CustomButtons/SettingsIconButton';
import type { MainNavBarProps } from '@/types/components';

// Placeholder components - TODO: Migrate these components
const NotificationMenu = ({ fontSize }: { fontSize?: string }) => {
  // fontSize is kept for future use when component is migrated
  void fontSize;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Notifications"
      className="text-[#0A2342] hover:text-[#52b274] transition-colors"
    >
      {/* TODO: Replace with actual NotificationMenu component */}
      <div className="size-6" />
    </Button>
  );
};

const ChatMenu = ({ fontSize }: { fontSize?: string }) => {
  // fontSize is kept for future use when component is migrated
  void fontSize;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Chat"
      className="text-[#0A2342] hover:text-[#52b274] transition-colors"
    >
      {/* TODO: Replace with actual ChatMenu component */}
      <div className="size-6" />
    </Button>
  );
};

const SubmitPost = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  return (
    <div className="p-4">
      {/* TODO: Replace with actual SubmitPost component */}
      <p>Submit Post Component - TODO: Migrate</p>
      <Button onClick={() => setOpen(false)}>Close</Button>
    </div>
  );
};

/**
 * MainNavBar Component
 * 
 * Main navigation bar for the application.
 * Shows different content based on authentication state.
 * Uses shadcn/ui components and Tailwind CSS for styling.
 */
export function MainNavBar({}: MainNavBarProps) {
  const router = useRouter();
  const { isMediumScreen } = useResponsive();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  // Get user data from Zustand store
  const user = useAppStore((state) => state.user.data);
  const setSelectedPage = useAppStore((state) => state.setSelectedPage);
  const loggedIn = !!user?._id;
  const avatar = typeof user?.avatar === 'string' ? user.avatar : undefined;
  const name = (typeof user?.name === 'string' ? user.name : undefined) || 
               (typeof user?.username === 'string' ? user.username : undefined) || 
               'User';

  const handleQuoteVote = () => {
    setSelectedPage('home');
  };

  const handleProfileClick = () => {
    setSelectedPage('profile');
  };

  const handleMenu = (newSelectedMenu: string) => {
    const client = getApolloClient();
    client.stop();
    setSelectedPage(newSelectedMenu);
  };

  const toggleDrawer = () => setDrawerOpen((prev) => !prev);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-white to-gray-50 border-b-2 border-transparent bg-clip-padding" style={{ borderImage: 'linear-gradient(90deg, #2AE6B2, #27C4E1, #178BE1) 1' }}>
        <div className="min-h-16 flex items-center justify-between px-6 md:px-12">
          {/* Logo */}
          <Link
            href="/search"
            onClick={handleQuoteVote}
            className="flex items-center no-underline hover:opacity-90 transition-opacity"
          >
            <Image
              src="/icons/android-chrome-192x192.png"
              alt="Quote.Vote"
              width={28}
              height={28}
              className="object-contain"
              crossOrigin="anonymous"
            />
          </Link>

          {/* Desktop Actions - Not Logged In */}
          {!loggedIn && isMediumScreen && (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                asChild
                className="text-[#20b087] font-medium hover:bg-[rgba(14,17,22,0.06)] hover:-translate-y-0.5 transition-all"
              >
                <a href="mailto:admin@quote.vote" target="_blank" rel="noopener noreferrer">
                  Donate
                </a>
              </Button>
              <Button
                variant="ghost"
                asChild
                className="text-[#20b087] font-medium hover:bg-[rgba(14,17,22,0.06)] hover:-translate-y-0.5 transition-all"
              >
                <a href="mailto:admin@quote.vote" target="_blank" rel="noopener noreferrer">
                  Volunteer
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-[#0A2342] hover:text-[#2AE6B2] hover:scale-110 transition-all"
              >
                <a
                  href="https://github.com/QuoteVote/quotevote-monorepo"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <Github className="size-5" />
                </a>
              </Button>
              <Button
                onClick={() => router.push('/auth/request-access')}
                className="bg-gradient-to-r from-[#2AE6B2] to-[#27C4E1] text-white font-semibold px-6 py-2 hover:from-[#27C4E1] hover:to-[#178BE1] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(42,230,178,0.3)] transition-all"
              >
                Request Invite
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/auth/login')}
                className="border-2 border-[#2AE6B2] text-[#0A2342] font-semibold px-6 py-2 hover:bg-[rgba(14,17,22,0.06)] hover:-translate-y-0.5 transition-all"
              >
                Login
              </Button>
            </div>
          )}

          {/* Desktop Actions - Logged In */}
          {loggedIn && isMediumScreen && (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  handleMenu('create-quote');
                  setSubmitDialogOpen(true);
                }}
                className="bg-[#52b274] text-white font-semibold min-w-[150px] hover:bg-[#459963] transition-colors"
              >
                Create Quote
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-[#0A2342] hover:text-[#2AE6B2] hover:scale-110 transition-all"
              >
                <a
                  href="https://github.com/QuoteVote/quotevote-monorepo"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <Github className="size-5" />
                </a>
              </Button>
              <Link href="/Profile" className="no-underline">
                <Button
                  variant="ghost"
                  onClick={handleProfileClick}
                  className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-[rgba(14,17,22,0.06)] transition-colors"
                >
                  <Avatar
                    src={avatar}
                    alt={name}
                    size="sm"
                    className="size-10"
                  />
                  <span className="text-[#0A2342] font-semibold ml-1">{name}</span>
                </Button>
              </Link>
              <div className="flex items-center gap-1">
                <ChatMenu fontSize="large" />
                <NotificationMenu fontSize="large" />
                <AdminIconButton fontSize="large" />
                <SettingsIconButton fontSize="large" />
              </div>
            </div>
          )}

          {/* Mobile Hamburger */}
          {!isMediumScreen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDrawer}
              aria-label="Open menu"
              className="text-[#0A2342]"
            >
              <Menu className="size-6" />
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-80 p-6">
          <SheetHeader>
            <SheetTitle className="text-[#0A2342] font-bold text-lg">Menu</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {!loggedIn ? (
              <>
                <Button
                  onClick={() => {
                    router.push('/auth/request-access');
                    closeDrawer();
                  }}
                  className="w-full justify-start bg-gradient-to-r from-[#2AE6B2] to-[#27C4E1] text-white font-semibold hover:from-[#27C4E1] hover:to-[#178BE1] hover:shadow-[0_4px_12px_rgba(42,230,178,0.3)] transition-all"
                >
                  Request Invite
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    router.push('/auth/login');
                    closeDrawer();
                  }}
                  className="w-full justify-start border-2 border-[#2AE6B2] text-[#0A2342] font-semibold hover:bg-[rgba(14,17,22,0.06)] transition-all"
                >
                  Login
                </Button>

                <div className="h-0.5 bg-gradient-to-r from-[#2AE6B2] via-[#27C4E1] to-[#178BE1] my-4" />

                <Button
                  variant="ghost"
                  asChild
                  className="w-full justify-start text-[#0A2342] font-medium hover:bg-[rgba(14,17,22,0.06)] transition-all"
                >
                  <a href="mailto:admin@quote.vote" target="_blank" rel="noopener noreferrer" onClick={closeDrawer}>
                    Donate
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  asChild
                  className="w-full justify-start text-[#0A2342] font-medium hover:bg-[rgba(14,17,22,0.06)] transition-all"
                >
                  <a href="mailto:admin@quote.vote" target="_blank" rel="noopener noreferrer" onClick={closeDrawer}>
                    Volunteer
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  asChild
                  className="w-full justify-start text-[#0A2342] font-medium hover:bg-[rgba(14,17,22,0.06)] transition-all"
                >
                  <a
                    href="https://github.com/QuoteVote/quotevote-monorepo"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeDrawer}
                    className="flex items-center gap-2"
                  >
                    <Github className="size-5" />
                    GitHub Repository
                  </a>
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    handleMenu('create-quote');
                    setSubmitDialogOpen(true);
                    closeDrawer();
                  }}
                  className="w-full justify-start bg-gradient-to-r from-[#2AE6B2] to-[#27C4E1] text-white font-semibold hover:from-[#27C4E1] hover:to-[#178BE1] hover:shadow-[0_4px_12px_rgba(42,230,178,0.3)] transition-all"
                >
                  Create Quote
                </Button>

                <div className="h-0.5 bg-gradient-to-r from-[#2AE6B2] via-[#27C4E1] to-[#178BE1] my-4" />

                <Link href="/Profile" className="w-full no-underline" onClick={closeDrawer}>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleProfileClick();
                      closeDrawer();
                    }}
                    className="w-full justify-start text-[#0A2342] font-medium hover:bg-[rgba(14,17,22,0.06)] transition-all"
                  >
                    <Avatar
                      src={avatar}
                      alt={name}
                      size="sm"
                      className="size-9 mr-2"
                    />
                    {name}
                  </Button>
                </Link>

                <div className="h-0.5 bg-gradient-to-r from-[#2AE6B2] via-[#27C4E1] to-[#178BE1] my-4" />

                <div className="flex items-center justify-center gap-4 w-full py-2">
                  <ChatMenu fontSize="default" />
                  <NotificationMenu fontSize="default" />
                  <AdminIconButton fontSize="default" onNavigate={closeDrawer} />
                  <SettingsIconButton fontSize="default" />
                </div>

                <div className="h-0.5 bg-gradient-to-r from-[#2AE6B2] via-[#27C4E1] to-[#178BE1] my-4" />

                <Button
                  variant="ghost"
                  asChild
                  className="w-full justify-start text-[#0A2342] font-medium hover:bg-[rgba(14,17,22,0.06)] transition-all"
                >
                  <a
                    href="https://github.com/QuoteVote/quotevote-monorepo"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeDrawer}
                    className="flex items-center gap-2"
                  >
                    <Github className="size-5" />
                    GitHub Repository
                  </a>
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Quote Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className={isMediumScreen ? 'max-w-md' : 'max-w-full h-full'}>
          <SubmitPost setOpen={setSubmitDialogOpen} />
        </DialogContent>
      </Dialog>
    </>
  );
}

