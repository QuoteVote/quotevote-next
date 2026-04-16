'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import {
  House,
  Search,
  PlusSquare,
  Bell,
  MessageSquare,
  User,
  Settings2,
  ShieldCheck,
  Mail,
  LogOut,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { getApolloClient } from '@/lib/apollo';
import { removeToken } from '@/lib/auth';
import { useAuthModal } from '@/context/AuthModalContext';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';
import { usePresenceSubscription } from '@/hooks/usePresenceSubscription';
import { useRosterManagement } from '@/hooks/useRosterManagement';
import { RequestInviteDialog } from '@/components/RequestInviteDialog';
import ChatContent from '@/components/Chat/ChatContent';
import { GET_NOTIFICATIONS } from '@/graphql/queries';
import Avatar from '@/components/Avatar';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const NAV_PAGES = [
  { path: '/dashboard/explore', page: 'home' },
  { path: '/dashboard/post', page: 'post' },
  { path: '/dashboard/profile', page: 'profile' },
  { path: '/dashboard/notifications', page: 'notifications' },
  { path: '/dashboard/settings', page: 'settings' },
  { path: '/dashboard/manage-invites', page: 'manage-invites' },
  { path: '/dashboard/control-panel', page: 'control-panel' },
] as const;

/* ------------------------------------------------------------------ */
/*  DashboardClient – mounts real-time hooks on the client             */
/* ------------------------------------------------------------------ */

function DashboardClient() {
  usePresenceHeartbeat();
  usePresenceSubscription();
  useRosterManagement();
  return null;
}

/* ------------------------------------------------------------------ */
/*  ChatPanel – right-side chat sheet                                  */
/* ------------------------------------------------------------------ */

function ChatPanel() {
  const chatOpen = useAppStore((s) => s.chat.open);
  const setChatOpen = useAppStore((s) => s.setChatOpen);

  return (
    <Sheet open={chatOpen} onOpenChange={setChatOpen}>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0">
        <div className="h-full">
          <ChatContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  DashboardLayout                                                    */
/* ------------------------------------------------------------------ */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const pathname = usePathname();
  const router = useRouter();
  const { isModalOpen, closeAuthModal } = useAuthModal();
  const setSelectedPage = useAppStore((s) => s.setSelectedPage);
  const setChatOpen = useAppStore((s) => s.setChatOpen);
  const chatOpen = useAppStore((s) => s.chat.open);

  const user = useAppStore((s) => s.user.data);
  const logout = useAppStore((s) => s.logout);

  const loggedIn = !!(user?.id || user?._id);
  const isAdmin = !!user?.admin;
  const avatar = typeof user?.avatar === 'string' ? user.avatar : undefined;
  const displayName =
    (typeof user?.name === 'string' ? user.name : undefined) ||
    (typeof user?.username === 'string' ? user.username : undefined) ||
    'User';

  /* Notification badge count */
  const { data: notifData } = useQuery<{ notifications: Array<{ _id: string; status: string }> }>(
    GET_NOTIFICATIONS,
    {
      skip: !loggedIn,
      fetchPolicy: 'cache-and-network',
      pollInterval: 60000, // re-check every 60 seconds
    }
  );

  const unreadCount = useMemo(() => {
    if (!notifData?.notifications) return 0;
    return notifData.notifications.filter((n) => n.status === 'new').length;
  }, [notifData]);

  /* Helper: is a given path the active route? */
  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/');

  /* Sync selected page with URL */
  useEffect(() => {
    const match = NAV_PAGES.find((l) => pathname.startsWith(l.path));
    setSelectedPage(match?.page || 'home');
  }, [pathname, setSelectedPage]);

  /* Logout handler */
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      removeToken();
      const client = getApolloClient();
      client.stop();
      client.resetStore();
      logout();
    }
    router.push('/auths/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to content link — visible only on keyboard focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to content
      </a>
      <DashboardClient />

      {/* ── Desktop top navbar (hidden on mobile) ── */}
      <header className="fixed top-0 left-0 right-0 z-40 hidden md:block h-16 border-b border-border bg-card">
        <div className="flex h-full items-center justify-between max-w-5xl mx-auto px-4">
          {/* Left: Logo */}
          <Link
            href="/dashboard/explore"
            className="flex items-center gap-2.5 no-underline flex-shrink-0"
          >
            <Image
              src="/icons/android-chrome-192x192.png"
              alt="Quote.Vote"
              width={28}
              height={28}
              className="object-contain"
              crossOrigin="anonymous"
            />
            <span className="text-lg font-semibold text-foreground">
              Quote.Vote
            </span>
          </Link>

          {/* Right: Nav icons + avatar */}
          <nav className="flex items-center gap-5">
            {/* Home */}
            <Link
              href="/dashboard/explore"
              className={cn(
                'transition-colors',
                isActive('/dashboard/explore')
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="Home"
            >
              <House
                className="size-6"
                fill={isActive('/dashboard/explore') ? 'currentColor' : 'none'}
              />
            </Link>

            {/* Create */}
            <Link
              href="/dashboard/post"
              className={cn(
                'transition-colors rounded-md border p-0.5',
                isActive('/dashboard/post')
                  ? 'text-foreground border-foreground'
                  : 'text-muted-foreground border-muted-foreground/40 hover:text-foreground hover:border-foreground'
              )}
              aria-label="Create post"
            >
              <PlusSquare className="size-5" />
            </Link>

            {/* Notifications */}
            <Link
              href="/dashboard/notifications"
              className={cn(
                'relative transition-colors',
                isActive('/dashboard/notifications')
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
            >
              <Bell
                className="size-6"
                fill={isActive('/dashboard/notifications') ? 'currentColor' : 'none'}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Chat toggle */}
            <button
              type="button"
              onClick={() => setChatOpen(!chatOpen)}
              className={cn(
                'transition-colors bg-transparent border-0 cursor-pointer p-0',
                chatOpen
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="Messages"
            >
              <MessageSquare
                className="size-6"
                fill={chatOpen ? 'currentColor' : 'none'}
              />
            </button>

            {/* User avatar dropdown */}
            {loggedIn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-transparent border-0 cursor-pointer p-0"
                    aria-label="User menu"
                  >
                    <Avatar
                      src={avatar}
                      alt={displayName}
                      size="sm"
                      className="size-8"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold">{displayName}</p>
                    {typeof user?.email === 'string' && (
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/profile')}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 size-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/settings')}
                    className="cursor-pointer"
                  >
                    <Settings2 className="mr-2 size-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/manage-invites')}
                    className="cursor-pointer"
                  >
                    <Mail className="mr-2 size-4" />
                    Manage Invites
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => router.push('/dashboard/control-panel')}
                        className="cursor-pointer"
                      >
                        <ShieldCheck className="mr-2 size-4" />
                        Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>
      </header>

      {/* ── Mobile top bar (hidden on desktop) ── */}
      <header className="fixed top-0 left-0 right-0 z-40 md:hidden h-14 border-b border-border bg-card">
        <div className="flex h-full items-center justify-between px-4">
          {/* Left: Logo */}
          <Link
            href="/dashboard/explore"
            className="flex items-center no-underline"
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

          {/* Right: Bell + Chat */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/notifications"
              className={cn(
                'relative transition-colors',
                isActive('/dashboard/notifications')
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
            >
              <Bell
                className="size-6"
                fill={isActive('/dashboard/notifications') ? 'currentColor' : 'none'}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setChatOpen(!chatOpen)}
              className={cn(
                'transition-colors bg-transparent border-0 cursor-pointer p-0',
                chatOpen
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="Messages"
            >
              <MessageSquare
                className="size-6"
                fill={chatOpen ? 'currentColor' : 'none'}
              />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom navigation bar (hidden on desktop) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden h-14 border-t border-border bg-card" aria-label="Mobile navigation">
        <div className="flex h-full items-center justify-around">
          {/* Home */}
          <Link
            href="/dashboard/explore"
            className={cn(
              'flex items-center justify-center flex-1 h-full transition-colors',
              isActive('/dashboard/explore')
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
            aria-label="Home"
          >
            <House
              className="size-6"
              fill={isActive('/dashboard/explore') ? 'currentColor' : 'none'}
            />
          </Link>

          {/* Search */}
          <Link
            href="/dashboard/explore"
            className={cn(
              'flex items-center justify-center flex-1 h-full transition-colors',
              'text-muted-foreground'
            )}
            aria-label="Search"
          >
            <Search className="size-6" />
          </Link>

          {/* Create */}
          <Link
            href="/dashboard/post"
            className={cn(
              'flex items-center justify-center flex-1 h-full transition-colors',
              isActive('/dashboard/post')
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
            aria-label="Create post"
          >
            <PlusSquare className="size-6" />
          </Link>

          {/* Notifications */}
          <Link
            href="/dashboard/notifications"
            className={cn(
              'relative flex items-center justify-center flex-1 h-full transition-colors',
              isActive('/dashboard/notifications')
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
            aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
          >
            <Bell
              className="size-6"
              fill={isActive('/dashboard/notifications') ? 'currentColor' : 'none'}
            />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 left-1/2 ml-2 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Profile (avatar circle) */}
          <Link
            href="/dashboard/profile"
            className={cn(
              'flex items-center justify-center flex-1 h-full transition-colors',
              isActive('/dashboard/profile')
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
            aria-label="Profile"
          >
            {loggedIn ? (
              <Avatar
                src={avatar}
                alt={displayName}
                size="sm"
                className={cn(
                  'size-7',
                  isActive('/dashboard/profile') && 'ring-2 ring-foreground'
                )}
              />
            ) : (
              <User className="size-6" />
            )}
          </Link>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main id="main-content" className="min-h-screen pt-14 md:pt-16 pb-16 md:pb-0">
        <div className="mx-auto px-4" style={{ maxWidth: pathname.startsWith('/dashboard/explore') ? 'none' : '42rem' }}>
          {children}
        </div>
      </main>

      {/* ── Overlays ── */}
      <ChatPanel />
      <RequestInviteDialog open={isModalOpen} onClose={closeAuthModal} />
    </div>
  );
}
