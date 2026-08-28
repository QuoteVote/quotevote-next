'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
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
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { Globe } from '@/components/Icons';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { getApolloClient } from '@/lib/apollo';
import { removeToken } from '@/lib/auth';
import { useAuthModal } from '@/context/AuthModalContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { routeHasPersistentChatPanel } from '@/lib/utils/chatLayout';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';
import { usePresenceSubscription } from '@/hooks/usePresenceSubscription';
import { useRosterManagement } from '@/hooks/useRosterManagement';
import { useSyncCurrentUserProfile } from '@/hooks/useSyncCurrentUserProfile';
import ChatContent from '@/components/Chat/ChatContent';
import { GET_NOTIFICATIONS, GET_CHAT_ROOMS } from '@/graphql/queries';
import { DisplayAvatar } from '@/components/DisplayAvatar';
import type { ChatRoom } from '@/types/chat';
import NavSearch from '@/components/Navbars/NavSearch';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { SubmitPost, SUBMIT_POST_DIALOG_CLASS } from '@/components/SubmitPost';
import { DashboardSidebars } from '@/components/DashboardSidebars';

/* ------------------------------------------------------------------ */

const NAV_PAGES = [
  { path: '/', page: 'home' },
  { path: '/post', page: 'post' },
  { path: '/profile', page: 'profile' },
  { path: '/notifications', page: 'notifications' },
  { path: '/settings', page: 'settings' },
  { path: '/control-panel', page: 'control-panel' },
] as const;

/* ------------------------------------------------------------------ */

function DashboardClient() {
  usePresenceHeartbeat();
  usePresenceSubscription();
  useRosterManagement();
  useSyncCurrentUserProfile();
  return null;
}

function ChatPanel() {
  const pathname = usePathname();
  const chatOpen = useAppStore((s) => s.chat.open);
  const setChatOpen = useAppStore((s) => s.setChatOpen);
  const isXlUp = useMediaQuery('(min-width: 1280px)');
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (routeHasPersistentChatPanel(pathname) && isXlUp) return null;

  return (
    <Sheet open={chatOpen} onOpenChange={setChatOpen} modal={false}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        overlayClassName={isMobile ? 'bottom-[56px]' : 'bottom-0'}
        className={cn(
          'w-full p-0 gap-0 overflow-hidden',
          isMobile
            ? 'bottom-[56px] h-[calc(100dvh-6.5rem)] max-h-[85dvh] rounded-t-2xl sm:max-w-none'
            : 'sm:w-[400px] sm:max-w-[400px] inset-y-0 h-full',
        )}
        data-testid="messages-panel"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetTitle className="sr-only">Messages</SheetTitle>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ChatContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  DashboardShell                                                      */
/* ------------------------------------------------------------------ */

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const pathname = usePathname();
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const setSelectedPage = useAppStore((s) => s.setSelectedPage);
  const chatOpen = useAppStore((s) => s.chat.open);
  const setChatOpen = useAppStore((s) => s.setChatOpen);
  const user = useAppStore((s) => s.user.data);
  const logout = useAppStore((s) => s.logout);
  const mobileDiscussionOpen = useAppStore((s) => s.ui.mobileDiscussionOpen);

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  const loggedIn = !!(user?.id || user?._id);
  const isAdmin = !!user?.admin;
  const username =
    (typeof user?.username === 'string' ? user.username : undefined) || '';
  const avatarSeed =
    (typeof user?.name === 'string' && user.name) || username || undefined;

  const { data: notifData } = useQuery<{ notifications: Array<{ _id: string; status: string }> }>(
    GET_NOTIFICATIONS,
    { skip: !loggedIn, fetchPolicy: 'cache-and-network', pollInterval: loggedIn ? 60000 : 0 }
  );

  const { data: roomsData } = useQuery<{ messageRooms: ChatRoom[] }>(GET_CHAT_ROOMS, {
    skip: !loggedIn,
    fetchPolicy: 'cache-and-network',
    pollInterval: loggedIn ? 8000 : 0,
  });

  const unreadCount = useMemo(
    () => notifData?.notifications?.filter((n) => n.status === 'new').length ?? 0,
    [notifData]
  );

  const unreadChat = useMemo(
    () => roomsData?.messageRooms?.reduce((s, r) => s + (r.unreadMessages ?? 0), 0) ?? 0,
    [roomsData]
  );

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/');
  const isMobilePostDetail = /^\/post\/[^/]+\/[^/]+\/[^/]+/.test(pathname);

  useEffect(() => {
    const match = NAV_PAGES.find((l) =>
      l.path === '/' ? pathname === '/' : pathname === l.path || pathname.startsWith(l.path + '/')
    );
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

  const handleSharePost = async () => {
    const url = window.location.href;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ url, title: 'Quote.Vote' });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const requireAuthForAction = (action: () => void, view: 'invite' | 'login' = 'login') => {
    if (!loggedIn) {
      openAuthModal({ view });
      return;
    }
    action();
  };

  const handleCreateClick = () => {
    requireAuthForAction(() => setSubmitDialogOpen(true));
  };

  const closeMessages = () => {
    if (chatOpen) setChatOpen(false);
  };

  return (
    <div className="bg-background h-[100dvh] overflow-hidden md:h-auto md:min-h-screen md:overflow-visible">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#52b274] focus:text-white focus:rounded-md focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to content
      </a>
      <DashboardClient />

      {/* DESKTOP NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 hidden md:flex h-[60px] bg-card border-b border-border shadow-[0_1px_4px_rgba(0,0,0,0.08)] items-center" data-testid="authenticated-navigation">
        <div className="relative flex h-full w-full items-center px-4">

          {/* Left: Logo */}
          <div className="flex items-center gap-2 flex-shrink-0 z-10">
            <Link
              href="/"
              className="flex items-center gap-2 no-underline flex-shrink-0"
              aria-label="Quote.Vote home"
            >
              <Globe size={36} className="size-9" />
              <span className="hidden lg:block text-[20px] font-extrabold tracking-tight text-[#52b274] select-none">
                Quote.Vote
              </span>
            </Link>
          </div>

          {/* Center: Search */}
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

          {/* Right: Actions */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0 z-10">
            <button
              type="button"
              data-testid="create-post-button"
              onClick={handleCreateClick}
              className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#52b274] text-white text-[13px] font-semibold shadow-[0_2px_6px_rgba(82,178,116,0.40)] hover:bg-[#4a9e63] hover:shadow-[0_3px_10px_rgba(82,178,116,0.50)] active:scale-95 transition-all duration-150 cursor-pointer border-0 flex-shrink-0"
              aria-label="Create new quote"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              <span>Create</span>
            </button>

            {loggedIn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 h-9 pl-1.5 pr-2.5 rounded-full bg-muted hover:bg-muted/70 transition-all duration-150 cursor-pointer border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274]/50 group"
                    aria-label="Account menu"
                    data-testid="user-profile-menu"
                  >
                    <DisplayAvatar
                      avatar={user?.avatar as string | Record<string, unknown> | undefined}
                      username={avatarSeed}
                      size={28}
                      className="size-7 flex-shrink-0"
                    />
                    <span className="text-[13px] font-semibold text-[#52b274] max-w-[90px] truncate">{username}</span>
                    <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={6} className="w-[300px] p-0 overflow-hidden rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
                  <div className="relative">
                    <div className="h-14 bg-gradient-to-r from-[#52b274] to-[#3a9e5f]" />
                    <div className="px-4 pb-3">
                      <DisplayAvatar
                        avatar={user?.avatar as string | Record<string, unknown> | undefined}
                        username={avatarSeed}
                        size={64}
                        className="size-16 -mt-8 ring-4 ring-card shadow-md"
                      />
                      <p className="mt-1 text-[15px] font-bold text-[#52b274]">{username}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="m-0" />
                  <div className="p-1.5">
                    <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer rounded-lg gap-3 py-2.5 px-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                        <User className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold">Your Profile</p>
                        <p className="text-[11px] text-muted-foreground">View and edit profile</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer rounded-lg gap-3 py-2.5 px-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                        <Settings2 className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold">Settings & Privacy</p>
                        <p className="text-[11px] text-muted-foreground">Manage your account</p>
                      </div>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => router.push('/control-panel')} className="cursor-pointer rounded-lg gap-3 py-2.5 px-3">
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

            {!loggedIn && (
              <button
                type="button"
                onClick={() => openAuthModal({ view: 'login' })}
                className="flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#52b274] text-[#52b274] text-[13px] font-semibold hover:bg-[#52b274]/10 transition-all duration-150 cursor-pointer flex-shrink-0"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE TOP BAR */}
      <header className="fixed top-0 left-0 right-0 z-50 md:hidden h-[56px] bg-card border-b border-border shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex items-center">
        {isMobilePostDetail ? (
          <div className="relative flex h-full w-full items-center px-1">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="z-10 inline-flex size-11 items-center justify-center text-foreground"
            >
              <ArrowLeft className="size-5" />
            </button>
            <Link
              href="/"
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-label="Quote.Vote home"
            >
              <span className="pointer-events-auto flex items-center gap-2">
                <Globe size={28} className="size-7" />
                <span className="font-extrabold text-lg tracking-wide select-none text-[#0A2342] dark:text-foreground">
                  Quote.Vote
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={handleSharePost}
              aria-label="Share"
              className="z-10 ml-auto inline-flex size-11 items-center justify-center text-foreground"
            >
              <Share2 className="size-5" />
            </button>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-between px-4">
            <Link
              href="/"
              className="flex items-center gap-2 no-underline"
              aria-label="Quote.Vote home"
            >
              <Globe size={28} className="size-7" />
              <span className="font-extrabold text-lg tracking-wide select-none text-[#0A2342] dark:text-foreground">
                Quote.Vote
              </span>
            </Link>
          </div>
        )}
      </header>

      {/* MOBILE BOTTOM NAV */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[60] md:hidden h-[56px] bg-card border-t border-border flex items-center',
          mobileDiscussionOpen && 'hidden',
        )}
        aria-label="Mobile navigation"
        data-testid="authenticated-navigation"
        hidden={mobileDiscussionOpen}
      >
        {/* Home */}
        <Link
          href="/"
          onClick={closeMessages}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150',
            isActive('/') ? 'text-[#52b274]' : 'text-muted-foreground'
          )}
          aria-label="Home"
        >
          <House className="size-[22px]" fill={isActive('/') ? 'currentColor' : 'none'} />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>

        {/* Messages */}
        <button
          type="button"
          onClick={() => requireAuthForAction(() => setChatOpen(!chatOpen))}
          className={cn(
            'relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150 border-0 bg-transparent cursor-pointer',
            chatOpen ? 'text-[#52b274]' : 'text-muted-foreground'
          )}
          aria-label="Messages"
          aria-expanded={chatOpen}
        >
          <div className="relative">
            <MessageSquare className="size-[22px]" fill={chatOpen ? 'currentColor' : 'none'} />
            {unreadChat > 0 && (
              <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold leading-none shadow ring-1 ring-card">
                {unreadChat > 9 ? '9+' : unreadChat}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold">Messages</span>
        </button>

        {/* Create */}
        <button
          type="button"
          data-testid="create-post-button"
          onClick={() => {
            closeMessages();
            handleCreateClick();
          }}
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
        <button
          type="button"
          onClick={() => requireAuthForAction(() => {
            closeMessages();
            router.push('/notifications');
          })}
          className={cn(
            'relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150 border-0 bg-transparent cursor-pointer',
            isActive('/notifications') ? 'text-[#52b274]' : 'text-muted-foreground'
          )}
          aria-label="Notifications"
        >
          <div className="relative">
            <Bell className="size-[22px]" fill={isActive('/notifications') ? 'currentColor' : 'none'} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold leading-none shadow ring-1 ring-card">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold">Activity</span>
        </button>

        {/* Profile */}
        {loggedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={closeMessages}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150 border-0 bg-transparent cursor-pointer',
                  isActive('/profile') ? 'text-[#52b274]' : 'text-muted-foreground'
                )}
                aria-label="Account menu"
                data-testid="user-profile-menu"
              >
                <DisplayAvatar
                  avatar={user?.avatar as string | Record<string, unknown> | undefined}
                  username={avatarSeed}
                  size={24}
                  className={cn(
                    'size-6 transition-all',
                    isActive('/profile') ? 'ring-2 ring-[#52b274] ring-offset-1' : 'ring-1 ring-border'
                  )}
                />
                <span className="text-[10px] font-semibold">Profile</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-56 mb-1">
              <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer gap-2.5 py-2.5">
                <User className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Your Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChatOpen(true)} className="cursor-pointer gap-2.5 py-2.5">
                <div className="relative">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  {unreadChat > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[12px] h-[12px] rounded-full bg-[#52b274] text-white text-[7px] font-bold leading-none">
                      {unreadChat > 9 ? '9+' : unreadChat}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium">Messages</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer gap-2.5 py-2.5">
                <Settings2 className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Settings &amp; Privacy</span>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => router.push('/control-panel')} className="cursor-pointer gap-2.5 py-2.5">
                  <ShieldCheck className="size-4 text-[#52b274]" />
                  <span className="text-sm font-medium text-[#52b274]">Admin Panel</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2.5 py-2.5 focus:bg-destructive/10">
                <LogOut className="size-4 text-red-500" />
                <span className="text-sm font-medium text-red-500">Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal({ view: 'login' })}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150 border-0 bg-transparent cursor-pointer',
              'text-muted-foreground'
            )}
            aria-label="Sign in"
          >
            <User className="size-[22px]" />
            <span className="text-[10px] font-semibold">Sign in</span>
          </button>
        )}
      </nav>

      {/* MAIN CONTENT */}
      <main
        id="main-content"
        className={cn(
          'h-full overflow-y-auto overscroll-contain pt-[56px] md:pt-[60px] md:pb-0 md:h-auto md:min-h-screen md:overflow-visible',
          mobileDiscussionOpen ? 'pb-0' : 'pb-[60px]',
        )}
      >
        {pathname.startsWith('/profile') || pathname.startsWith('/settings') ? (
          <div
            className={cn(
              'lg:pl-[300px] xl:pl-[340px]',
              loggedIn && 'xl:pr-[360px] 2xl:pr-[420px]'
            )}
          >
            <DashboardSidebars />
            <div className="min-w-0 px-4">
              {children}
            </div>
          </div>
        ) : (
          <div
            className={cn('mx-auto px-0 md:px-4', pathname.startsWith('/post/') && 'md:px-8 lg:px-12 h-full md:h-auto')}
            style={{
              maxWidth: pathname.startsWith('/control-panel')
                ? 'none'
                : pathname.startsWith('/post/')
                  ? '1170px'
                  : '42rem',
            }}
          >
            {children}
          </div>
        )}
      </main>

      <ChatPanel />

      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className={SUBMIT_POST_DIALOG_CLASS} showCloseButton={false}>
          <DialogTitle className="sr-only">Create Quotes</DialogTitle>
          <SubmitPost setOpen={setSubmitDialogOpen} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
