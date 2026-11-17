'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { Settings2, ShieldCheck, LogOut, Github } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { getApolloClient } from '@/lib/apollo';
import { removeToken } from '@/lib/auth';
import { useAuthModal } from '@/context/AuthModalContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { toAbsolutePostUrl } from '@/lib/utils/sanitizeUrl';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';
import { useOnTabVisible } from '@/hooks/useOnTabVisible';
import { usePresenceSubscription } from '@/hooks/usePresenceSubscription';
import { useSyncCurrentUserProfile } from '@/hooks/useSyncCurrentUserProfile';
import ChatContent from '@/components/Chat/ChatContent';
import { GET_NOTIFICATIONS, GET_CHAT_ROOMS } from '@/graphql/queries';
import type { ChatRoom } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { SubmitPost, SUBMIT_POST_DIALOG_CLASS } from '@/components/SubmitPost';
import { NotificationsPanel } from '@/components/Notifications/NotificationsPanel';
import { AppHeader } from '@/components/AppShell/AppHeader';
import { MobileTopBar } from '@/components/AppShell/MobileTopBar';
import { MobileTabBar } from '@/components/AppShell/MobileTabBar';
import type { ShellAvatar, ShellUser } from '@/types/appShell';

/* ------------------------------------------------------------------ */

const NAV_PAGES = [
  { path: '/', page: 'home' },
  { path: '/post', page: 'post' },
  { path: '/profile', page: 'profile' },
  { path: '/notifications', page: 'notifications' },
  { path: '/settings', page: 'settings' },
  { path: '/control-panel', page: 'control-panel' },
] as const;

const DONATE_URL = 'https://opencollective.com/quotevote/donate';
const GITHUB_URL = 'https://github.com/QuoteVote/quotevote-next';

/* ------------------------------------------------------------------ */

function DashboardClient() {
  usePresenceHeartbeat();
  usePresenceSubscription();
  useSyncCurrentUserProfile();
  return null;
}

function ChatPanel() {
  const chatOpen = useAppStore((s) => s.chat.open);
  const setChatOpen = useAppStore((s) => s.setChatOpen);
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <Sheet open={chatOpen} onOpenChange={setChatOpen} modal={false}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        overlayClassName={isMobile ? 'bottom-[var(--app-tabbar-h)]' : 'bottom-0'}
        className={cn(
          'w-full p-0 gap-0 overflow-hidden',
          isMobile
            ? 'bottom-[var(--app-tabbar-h)] h-[calc(100dvh-var(--app-header-h)-var(--app-tabbar-h))] max-h-[85dvh] rounded-t-2xl sm:max-w-none'
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

function AuthenticatedAccountSheet({
  open,
  onOpenChange,
  isAdmin,
  onLogout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  onLogout: () => void;
}) {
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" overlayClassName="z-[70]" className="z-[70] w-80 p-6">
        <SheetHeader>
          <SheetTitle className="text-[#0A2342] dark:text-foreground font-bold text-lg">Menu</SheetTitle>
        </SheetHeader>
        <nav className="mt-1 flex flex-col gap-3" aria-label="Account menu" data-testid="authenticated-account-menu">
          <Button variant="ghost" asChild className="w-full justify-start">
            <Link href="/settings" onClick={close}>
              <Settings2 className="size-4" />
              Settings
            </Link>
          </Button>
          {isAdmin && (
            <Button variant="ghost" asChild className="w-full justify-start">
              <Link href="/control-panel" onClick={close}>
                <ShieldCheck className="size-4 text-[#52b274]" />
                Admin Panel
              </Link>
            </Button>
          )}
          <Button variant="ghost" asChild className="w-full justify-start">
            <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" onClick={close}>
              Donate
            </a>
          </Button>
          <Button variant="ghost" asChild className="w-full justify-start">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" onClick={close}>
              <Github className="size-4" />
              GitHub
            </a>
          </Button>
          <div className="my-1 h-px bg-border" role="separator" />
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start text-[#c62828] hover:text-[#c62828] hover:bg-destructive/10 dark:text-[#ff6b6b] dark:hover:text-[#ff6b6b]"
            onClick={() => {
              close();
              onLogout();
            }}
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </nav>
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
  const notificationsOpen = useAppStore((s) => s.ui.notificationsOpen);
  const setNotificationsOpen = useAppStore((s) => s.setNotificationsOpen);

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const { data: roomsData, refetch: refetchRooms } = useQuery<{ messageRooms: ChatRoom[] }>(
    GET_CHAT_ROOMS,
    {
      skip: !loggedIn,
      fetchPolicy: 'cache-and-network',
      pollInterval: loggedIn ? 8000 : 0,
    }
  );

  // Polls pause in background tabs, so refresh the unread badge on return (#625).
  useOnTabVisible(() => {
    refetchRooms().catch(() => undefined);
  }, loggedIn);

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
    const url = toAbsolutePostUrl(pathname);
    if (!url) {
      toast.error('Unable to share — open a post to copy its link');
      return;
    }
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

  // Home pins its own search at the top; elsewhere, go home where the search lives.
  const handleMobileSearch = () => {
    const input = document.querySelector<HTMLInputElement>('[data-testid="directory-search"]');
    if (pathname === '/' && input) {
      input.focus();
      return;
    }
    closeOverlays();
    router.push('/');
  };

  const shellUser: ShellUser | null = loggedIn
    ? {
        username,
        avatar: user?.avatar as ShellAvatar,
        avatarSeed,
        isAdmin,
      }
    : null;
  const counts = { unreadMessages: unreadChat, unreadNotifications: unreadCount };
  const desktopPanels = {
    chatOpen,
    notificationsOpen,
    onToggleChat: () => setChatOpen(!chatOpen),
    onToggleNotifications: () => setNotificationsOpen(!notificationsOpen),
  };
  const mobilePanels = {
    chatOpen,
    notificationsOpen,
    onToggleChat: () =>
      requireAuthForAction(() => {
        setNotificationsOpen(false);
        setChatOpen(!chatOpen);
      }),
    onToggleNotifications: () =>
      requireAuthForAction(() => {
        if (chatOpen) setChatOpen(false);
        setNotificationsOpen(!notificationsOpen);
      }),
  };

  // On mobile both panels are bottom sheets over the same area, so only one stays open.
  const closeOverlays = () => {
    if (chatOpen) setChatOpen(false);
    if (notificationsOpen) setNotificationsOpen(false);
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

      <AppHeader
        user={shellUser}
        counts={counts}
        panels={desktopPanels}
        onCreate={handleCreateClick}
        onSignIn={() => openAuthModal({ view: 'login' })}
        onLogout={handleLogout}
      />

      <MobileTopBar
        isPostDetail={isMobilePostDetail}
        loggedIn={loggedIn}
        onBack={() => router.back()}
        onShare={handleSharePost}
        onSearch={handleMobileSearch}
        onOpenMenu={() => setMenuOpen(true)}
      />

      <MobileTabBar
        user={shellUser}
        counts={counts}
        panels={mobilePanels}
        homeActive={isActive('/')}
        profileActive={isActive('/profile')}
        createActive={submitDialogOpen}
        hidden={mobileDiscussionOpen}
        onHome={closeOverlays}
        onCreate={() => {
          closeOverlays();
          handleCreateClick();
        }}
        onSignIn={() => openAuthModal({ view: 'login' })}
      />

      {/* MAIN CONTENT */}
      <main
        id="main-content"
        className={cn(
          'h-full overscroll-contain pt-[var(--app-header-h)] md:pb-0 md:h-auto md:min-h-screen md:overflow-visible',
          mobileDiscussionOpen ? 'pb-0' : 'pb-[var(--app-tabbar-h)]',
          // Home pins search/filters above the post list on mobile (#487 / #488).
          pathname === '/' ? 'overflow-hidden' : 'overflow-y-auto',
        )}
      >
        {pathname.startsWith('/profile') || pathname.startsWith('/settings') ? (
          // No fixed Messages / Buddy List column here (#536): Profile and Settings
          // are their own pages, and Messages stays one tap away in the main nav.
          <div
            className={cn(
              'mx-auto min-w-0 px-4',
              // The avatar editor (#656) uses a two-column layout on desktop.
              /^\/profile\/[^/]+\/avatar\/?$/.test(pathname) ? 'max-w-[1232px]' : 'max-w-3xl',
            )}
          >
            {children}
          </div>
        ) : (
          <div
            className={cn(
              'mx-auto px-0 md:px-4',
              pathname === '/' && 'h-full min-h-0 md:h-auto',
              pathname.startsWith('/post/') && 'md:px-8 lg:px-12 h-full md:h-auto',
            )}
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
      {loggedIn && <NotificationsPanel />}

      {loggedIn && (
        <AuthenticatedAccountSheet
          open={menuOpen}
          onOpenChange={setMenuOpen}
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />
      )}

      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className={SUBMIT_POST_DIALOG_CLASS} showCloseButton={false}>
          <DialogTitle className="sr-only">Create Quotes</DialogTitle>
          <SubmitPost setOpen={setSubmitDialogOpen} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
