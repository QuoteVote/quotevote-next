'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import {
  House,
  Search,
  Plus,
  Bell,
  MessageSquare,
  User,
  Settings2,
  ShieldCheck,
  LogOut,
  ChevronDown,
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
import { GET_NOTIFICATIONS, GET_CHAT_ROOMS } from '@/graphql/queries';
import { DisplayAvatar } from '@/components/DisplayAvatar';
import type { ChatRoom } from '@/types/chat';
import NavSearch from '@/components/Navbars/NavSearch';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { SubmitPost } from '@/components/SubmitPost/SubmitPost';

/* ------------------------------------------------------------------ */

const NAV_PAGES = [
  { path: '/dashboard/explore', page: 'home' },
  { path: '/dashboard/post', page: 'post' },
  { path: '/dashboard/profile', page: 'profile' },
  { path: '/dashboard/notifications', page: 'notifications' },
  { path: '/dashboard/settings', page: 'settings' },
  { path: '/dashboard/control-panel', page: 'control-panel' },
] as const;

/* ------------------------------------------------------------------ */

function DashboardClient() {
  usePresenceHeartbeat();
  usePresenceSubscription();
  useRosterManagement();
  return null;
}

function ChatPanel() {
  const chatOpen = useAppStore((s) => s.chat.open);
  const setChatOpen = useAppStore((s) => s.setChatOpen);
  return (
    <Sheet open={chatOpen} onOpenChange={setChatOpen}>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0">
        <div className="h-full"><ChatContent /></div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Icon button with badge                                             */
/* ------------------------------------------------------------------ */

function IconBtn({
  label,
  badge,
  badgeColor = 'red',
  active,
  onClick,
  children,
}: {
  label: string;
  badge?: number;
  badgeColor?: 'red' | 'green';
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-150 cursor-pointer border-0',
        active
          ? 'bg-[#e8f5ee] text-[#52b274]'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
      )}
    >
      {children}
      {!!badge && badge > 0 && (
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] font-bold leading-none shadow ring-2 ring-background',
            badgeColor === 'green' ? 'bg-[#52b274]' : 'bg-red-500'
          )}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
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

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  const loggedIn = !!(user?.id || user?._id);
  const isAdmin = !!user?.admin;
  const username =
    (typeof user?.username === 'string' ? user.username : undefined) || '';

  const { data: notifData } = useQuery<{ notifications: Array<{ _id: string; status: string }> }>(
    GET_NOTIFICATIONS,
    { skip: !loggedIn, fetchPolicy: 'cache-and-network', pollInterval: 60000 }
  );

  const { data: roomsData } = useQuery<{ messageRooms: ChatRoom[] }>(GET_CHAT_ROOMS, {
    skip: !loggedIn,
    fetchPolicy: 'cache-and-network',
    pollInterval: 8000,
  });

  const unreadCount = useMemo(
    () => notifData?.notifications?.filter((n) => n.status === 'new').length ?? 0,
    [notifData]
  );

  const unreadChat = useMemo(
    () => roomsData?.messageRooms?.reduce((s, r) => s + (r.unreadMessages ?? 0), 0) ?? 0,
    [roomsData]
  );

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  useEffect(() => {
    const match = NAV_PAGES.find((l) => pathname.startsWith(l.path));
    setSelectedPage(match?.page || 'home');
  }, [pathname, setSelectedPage]);

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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#52b274] focus:text-white focus:rounded-md focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to content
      </a>
      <DashboardClient />

      {/* ════════════════════════════════════════════════════════════════
          DESKTOP NAVBAR
      ════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 hidden md:flex h-[60px] bg-card border-b border-border shadow-[0_1px_4px_rgba(0,0,0,0.08)] items-center">
        <div className="relative flex h-full w-full items-center px-4">

          {/* ── Left: Logo ── */}
          <div className="flex items-center gap-2 flex-shrink-0 z-10">
            <Link href="/dashboard/explore" className="flex items-center gap-2 no-underline flex-shrink-0">
              <Image
                src="/icons/android-chrome-192x192.png"
                alt="Quote.Vote"
                width={36}
                height={36}
                className="object-contain rounded-full"
                crossOrigin="anonymous"
              />
              <span className="hidden lg:block text-[20px] font-extrabold tracking-tight text-[#52b274] select-none">
                Quote.Vote
              </span>
            </Link>
          </div>

          {/* ── Center: Search (truly centered) ── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto w-[440px] xl:w-[560px] 2xl:w-[640px]">
              <Suspense fallback={
                <div className="flex items-center gap-2 h-[38px] w-full rounded-full px-3.5 bg-muted">
                  <Search className="size-[15px] text-muted-foreground" />
                  <span className="text-[13px] text-muted-foreground">Search…</span>
                </div>
              }>
                <NavSearch />
              </Suspense>
            </div>
          </div>

          {/* ── Right: Actions ── */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0 z-10">
            {/* Create */}
            <button
              type="button"
              onClick={() => setSubmitDialogOpen(true)}
              className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#52b274] text-white text-[13px] font-semibold shadow-[0_2px_6px_rgba(82,178,116,0.40)] hover:bg-[#4a9e63] hover:shadow-[0_3px_10px_rgba(82,178,116,0.50)] active:scale-95 transition-all duration-150 cursor-pointer border-0 flex-shrink-0"
              aria-label="Create new quote"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              <span>Create</span>
            </button>

            {/* Avatar dropdown */}
            {loggedIn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 h-9 pl-1.5 pr-2.5 rounded-full bg-muted hover:bg-muted/70 transition-all duration-150 cursor-pointer border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274]/50 group"
                    aria-label="Account menu"
                  >
                    <DisplayAvatar
                      avatar={user?.avatar as string | Record<string, unknown> | undefined}
                      username={username || undefined}
                      size={28}
                      className="size-7 flex-shrink-0"
                    />
                    <span className="text-[13px] font-semibold text-[#52b274] max-w-[90px] truncate">{username}</span>
                    <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={6} className="w-[300px] p-0 overflow-hidden rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
                  {/* Profile card header */}
                  <div className="relative">
                    <div className="h-14 bg-gradient-to-r from-[#52b274] to-[#3a9e5f]" />
                    <div className="px-4 pb-3">
                      <DisplayAvatar
                        avatar={user?.avatar as string | Record<string, unknown> | undefined}
                        username={username || undefined}
                        size={64}
                        className="size-16 -mt-8 ring-4 ring-card shadow-md"
                      />
                      <p className="mt-1 text-[15px] font-bold text-[#52b274]">{username}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="m-0" />
                  <div className="p-1.5">
                    <DropdownMenuItem onClick={() => router.push('/dashboard/profile')} className="cursor-pointer rounded-lg gap-3 py-2.5 px-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                        <User className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold">Your Profile</p>
                        <p className="text-[11px] text-muted-foreground">View and edit profile</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/dashboard/settings')} className="cursor-pointer rounded-lg gap-3 py-2.5 px-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                        <Settings2 className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold">Settings & Privacy</p>
                        <p className="text-[11px] text-muted-foreground">Manage your account</p>
                      </div>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => router.push('/dashboard/control-panel')} className="cursor-pointer rounded-lg gap-3 py-2.5 px-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#e8f5ee]">
                          <ShieldCheck className="size-4 text-[#52b274]" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[#52b274]">Admin Panel</p>
                          <p className="text-[11px] text-muted-foreground">Manage the platform</p>
                        </div>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-lg gap-3 py-2.5 px-3 focus:bg-destructive/10">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10">
                        <LogOut className="size-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-red-500">Sign out</p>
                        <p className="text-[11px] text-muted-foreground">See you next time!</p>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════
          MOBILE TOP BAR
      ════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 md:hidden h-[56px] bg-card border-b border-border shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex items-center">
        <div className="flex h-full w-full items-center justify-between px-4">
          <Link href="/dashboard/explore" className="flex items-center gap-2 no-underline">
            <Image
              src="/icons/android-chrome-192x192.png"
              alt="Quote.Vote"
              width={32}
              height={32}
              className="object-contain rounded-full"
              crossOrigin="anonymous"
            />
            <span className="text-[18px] font-extrabold tracking-tight text-[#52b274]">Quote.Vote</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <IconBtn
              label="Messages"
              badge={unreadChat}
              badgeColor="green"
              active={chatOpen}
              onClick={() => setChatOpen(!chatOpen)}
            >
              <MessageSquare className="size-5" fill={chatOpen ? 'currentColor' : 'none'} />
            </IconBtn>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════
          MOBILE BOTTOM NAV
      ════════════════════════════════════════════════════════════════ */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden h-[56px] bg-card border-t border-border flex items-center"
        aria-label="Mobile navigation"
      >
        {/* Home */}
        <Link
          href="/dashboard/explore"
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150',
            isActive('/dashboard/explore') ? 'text-[#52b274]' : 'text-muted-foreground'
          )}
          aria-label="Home"
        >
          <House className="size-[22px]" fill={isActive('/dashboard/explore') ? 'currentColor' : 'none'} />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>

        {/* Messages */}
        <button
          type="button"
          onClick={() => setChatOpen(!chatOpen)}
          className={cn(
            'relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150 border-0 bg-transparent cursor-pointer',
            chatOpen ? 'text-[#52b274]' : 'text-muted-foreground'
          )}
          aria-label="Messages"
        >
          <div className="relative">
            <MessageSquare className="size-[22px]" fill={chatOpen ? 'currentColor' : 'none'} />
            {unreadChat > 0 && (
              <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#52b274] text-white text-[8px] font-bold leading-none shadow ring-1 ring-card">
                {unreadChat > 9 ? '9+' : unreadChat}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold">Messages</span>
        </button>

        {/* Create — floating green circle */}
        <button
          type="button"
          onClick={() => setSubmitDialogOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full cursor-pointer border-0 bg-transparent"
          aria-label="Create"
        >
          <div className={cn(
            'flex items-center justify-center w-12 h-12 rounded-full -mt-5 shadow-[0_4px_14px_rgba(82,178,116,0.50)] transition-all duration-150',
            submitDialogOpen ? 'bg-[#4a9e63] scale-95' : 'bg-[#52b274] hover:bg-[#4a9e63] active:scale-90'
          )}>
            <Plus className="size-6 text-white" strokeWidth={2.5} />
          </div>
        </button>

        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className={cn(
            'relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150',
            isActive('/dashboard/notifications') ? 'text-[#52b274]' : 'text-muted-foreground'
          )}
          aria-label="Notifications"
        >
          <div className="relative">
            <Bell className="size-[22px]" fill={isActive('/dashboard/notifications') ? 'currentColor' : 'none'} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold leading-none shadow ring-1 ring-card">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold">Activity</span>
        </Link>

        {/* Profile */}
        <Link
          href="/dashboard/profile"
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150',
            isActive('/dashboard/profile') ? 'text-[#52b274]' : 'text-muted-foreground'
          )}
          aria-label="Profile"
        >
          {loggedIn ? (
            <DisplayAvatar
              avatar={user?.avatar as string | Record<string, unknown> | undefined}
              username={username || undefined}
              size={24}
              className={cn(
                'size-6 transition-all',
                isActive('/dashboard/profile') ? 'ring-2 ring-[#52b274] ring-offset-1' : 'ring-1 ring-border'
              )}
            />
          ) : (
            <User className="size-[22px]" />
          )}
          <span className="text-[10px] font-semibold">Profile</span>
        </Link>
      </nav>

      {/* ════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════════════════════════ */}
      <main id="main-content" className="min-h-screen pt-[56px] md:pt-[60px] pb-[60px] md:pb-0">
        <div
          className={cn('mx-auto px-0 md:px-4', pathname.startsWith('/dashboard/post/') && 'md:px-8 lg:px-12')}
          style={{
            maxWidth: pathname.startsWith('/dashboard/explore') || pathname.startsWith('/dashboard/control-panel')
              ? 'none'
              : pathname.startsWith('/dashboard/post/')
                ? '1170px'
                : '42rem',
          }}
        >
          {children}
        </div>
      </main>

      <ChatPanel />
      <RequestInviteDialog open={isModalOpen} onClose={closeAuthModal} />

      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="max-w-md p-0" showCloseButton={false}>
          <DialogTitle className="sr-only">Create Quote</DialogTitle>
          <SubmitPost setOpen={setSubmitDialogOpen} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
