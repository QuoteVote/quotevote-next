'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, Plus, Github, Search, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { useResponsive } from '@/hooks/useResponsive';
import { getApolloClient } from '@/lib/apollo';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar } from '@/components/Avatar';
import { AdminIconButton } from '../CustomButtons/AdminIconButton';
import { SettingsIconButton } from '../CustomButtons/SettingsIconButton';
import type { SidebarProps, SidebarWrapperProps } from '@/types/components';

// Placeholder components - TODO: Migrate these components
const NotificationMenu = ({ fontSize }: { fontSize?: string }) => {
  void fontSize;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Notifications"
      className="text-[#0A2342] hover:text-[#52b274] transition-colors"
    >
      <div className="size-6" />
    </Button>
  );
};

const ChatMenu = ({ fontSize }: { fontSize?: string }) => {
  void fontSize;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Chat"
      className="text-[#0A2342] hover:text-[#52b274] transition-colors"
    >
      <div className="size-6" />
    </Button>
  );
};

const SubmitPost = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  return (
    <div className="p-4">
      <p>Submit Post Component - TODO: Migrate</p>
      <Button onClick={() => setOpen(false)}>Close</Button>
    </div>
  );
};

/**
 * SidebarWrapper Component
 * 
 * Wrapper component for sidebar content sections
 */
function SidebarWrapper({ className, user, headerLinks, links }: SidebarWrapperProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {user}
      {headerLinks}
      {links}
    </div>
  );
}

/**
 * Sidebar Component
 * 
 * Main sidebar component using shadcn/ui Sheet instead of MUI Drawer.
 * Handles navigation, user menu, and responsive behavior.
 */
export function Sidebar({
  open,
  onOpenChange,
  bgColor = 'blue',
  rtlActive = false,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSmallScreen } = useResponsive();
  
  // Get user data from Zustand store
  const user = useAppStore((state) => state.user.data);
  const logout = useAppStore((state) => state.logout);
  const loggedIn = !!user?._id;
  const avatar = typeof user?.avatar === 'string' ? user.avatar : undefined;
  const name = (typeof user?.name === 'string' ? user.name : undefined) || 
               (typeof user?.username === 'string' ? user.username : undefined) || 
               'Profile';

  // State management
  const [openCreateQuote, setOpenCreateQuote] = useState(false);

  const handleDrawerToggle = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const handleDrawerOpen = () => {
    handleDrawerToggle(true);
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isSmallScreen) {
      e.preventDefault();
      handleDrawerOpen();
    }
  };

  // Note: handleVoxPop kept for potential future use
  // const handleVoxPop = () => {
  //   setSelectedPage('home');
  //   router.push('/search');
  //   handleDrawerToggle(false);
  // };

  const handleLogout = () => {
    handleDrawerToggle(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      const client = getApolloClient();
      client.stop();
      client.resetStore();
      logout();
    }
    router.push('/auth/login');
  };

  // Check if route is active
  const isActiveRoute = (routePath: string): boolean => {
    return pathname === routePath || pathname.startsWith(routePath + '/');
  };

  // Create guest links
  const createGuestLinks = () => {
    return (
      <div className="flex flex-col gap-1 p-4">
        <Link 
          href="/" 
          className="inline-block w-full"
          onClick={() => handleDrawerToggle(false)}
        >
          <Image
            src="/icons/android-chrome-192x192.png"
            alt="QuoteVote Logo"
            width={30}
            height={30}
            className="cursor-pointer"
          />
        </Link>
        
        <Link
          href="mailto:admin@quote.vote"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
          onClick={() => handleDrawerToggle(false)}
        >
          <span className="text-base">🤲</span>
          <span>Donate</span>
        </Link>

        <Link
          href="mailto:admin@quote.vote"
          className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
          onClick={() => handleDrawerToggle(false)}
        >
          <span className="text-base">🫱</span>
          <span>Volunteer</span>
        </Link>

        <Link
          href="https://github.com/QuoteVote/quotevote-monorepo"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
          onClick={() => handleDrawerToggle(false)}
        >
          <Github size={16} />
          <span>GitHub</span>
        </Link>

        <Link
          href="/auth/request-access"
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors",
            isActiveRoute('/auth/request-access') && "bg-accent"
          )}
          onClick={() => handleDrawerToggle(false)}
        >
          <span className="text-base">💌</span>
          <span>Request Invite</span>
        </Link>

        <Link
          href="/auth/login"
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors",
            isActiveRoute('/auth/login') && "bg-accent"
          )}
          onClick={() => handleDrawerToggle(false)}
        >
          <User size={16} />
          <span>Login</span>
        </Link>
      </div>
    );
  };

  // Create logged-in user links
  const createUserLinks = () => {
    return (
      <div className="flex flex-col gap-1 p-4">
        {/* Profile Section */}
        <Link
          href="/Profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
            isActiveRoute('/Profile') ? "bg-accent" : "hover:bg-accent"
          )}
          onClick={() => handleDrawerToggle(false)}
        >
          <Avatar
            src={avatar}
            alt={name}
            size="sm"
            className="size-8"
          />
          <span className="text-sm font-medium">{name || 'Profile'}</span>
        </Link>

        <div className="h-px bg-border my-2" />

        {/* Search */}
        <Link
          href="/search"
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md transition-colors",
            isActiveRoute('/search') ? "bg-accent" : "hover:bg-accent"
          )}
          onClick={() => handleDrawerToggle(false)}
        >
          <Search size={16} />
          <span>Search</span>
        </Link>

        {/* Profile (simplified) */}
        <Link
          href="/Profile"
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md transition-colors",
            isActiveRoute('/Profile') ? "bg-accent" : "hover:bg-accent"
          )}
          onClick={() => handleDrawerToggle(false)}
        >
          <User size={16} />
          <span>Profile</span>
        </Link>

        {/* GitHub */}
        <Link
          href="https://github.com/QuoteVote/quotevote-monorepo"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
          onClick={() => handleDrawerToggle(false)}
        >
          <Github size={16} />
          <span>GitHub</span>
        </Link>

        <div className="h-px bg-border my-2" />

        {/* Sign Out */}
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </Button>
      </div>
    );
  };

  return (
    <>
      {/* AppBar with Menu Button */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Left: Menu icon and logo */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              className="p-0"
            >
              <Menu />
            </Button>
            <Link 
              href="/" 
              className="inline-block" 
              onClick={handleLogoClick}
            >
              <Image
                src="/icons/android-chrome-192x192.png"
                alt="QuoteVote Logo"
                width={30}
                height={30}
                className="cursor-pointer"
              />
            </Link>
          </div>

          {/* Right: Action buttons */}
          {!loggedIn ? (
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  router.push('/auth/request-access');
                }}
              >
                Request Invite
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push('/auth/login');
                }}
              >
                Login
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="icon"
                onClick={() => setOpenCreateQuote(true)}
                className="h-8 w-8"
                aria-label="Create Quote"
              >
                <Plus size={16} />
              </Button>
              
              {!isSmallScreen && (
                <Link
                  href="https://github.com/QuoteVote/quotevote-monorepo"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="text-foreground hover:text-[#52b274] transition-colors"
                >
                  <Github size={28} />
                </Link>
              )}
              
              <ChatMenu fontSize="default" />
              <NotificationMenu fontSize="default" />
              <AdminIconButton fontSize="default" onNavigate={() => handleDrawerToggle(false)} />
              <SettingsIconButton fontSize="default" />
            </div>
          )}
        </div>
      </header>

      {/* Sidebar Sheet */}
      <Sheet open={open} onOpenChange={handleDrawerToggle}>
        <SheetContent 
          side={rtlActive ? 'left' : 'right'}
          className={cn(
            "w-3/4 sm:max-w-sm p-0",
            bgColor === 'white' && "bg-white",
            bgColor === 'black' && "bg-black",
            bgColor === 'blue' && "bg-background"
          )}
        >
          <SidebarWrapper
            className="h-full overflow-y-auto"
            links={loggedIn ? createUserLinks() : createGuestLinks()}
          />
        </SheetContent>
      </Sheet>

      {/* Create Quote Dialog */}
      <Dialog open={openCreateQuote} onOpenChange={setOpenCreateQuote}>
        <DialogContent className="max-w-full h-full sm:max-w-full">
          <DialogHeader>
            <DialogTitle className="sr-only">Create Quote</DialogTitle>
            <DialogDescription>
              Create a new quote post to share with the community
            </DialogDescription>
          </DialogHeader>
          <SubmitPost setOpen={setOpenCreateQuote} />
        </DialogContent>
      </Dialog>
    </>
  );
}

