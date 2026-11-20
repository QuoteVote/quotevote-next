'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { getApolloClient } from '@/lib/apollo';
import { removeToken } from '@/lib/auth';
import { useAuthModal } from '@/context/AuthModalContext';
import { toAbsolutePostUrl } from '@/lib/utils/sanitizeUrl';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';
import { useOnTabVisible } from '@/hooks/useOnTabVisible';
import { usePresenceSubscription } from '@/hooks/usePresenceSubscription';
import { useSyncCurrentUserProfile } from '@/hooks/useSyncCurrentUserProfile';
import ChatContent from '@/components/Chat/ChatContent';
import { GET_NOTIFICATIONS, GET_CHAT_ROOMS } from '@/graphql/queries';
import type { ChatRoom } from '@/types/chat';
import { DisplayAvatar } from '@/components/DisplayAvatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { SubmitPost, SUBMIT_POST_DIALOG_CLASS, SUBMIT_POST_OVERLAY_CLASS } from '@/components/SubmitPost';
import { NotificationsPanel } from '@/components/Notifications/NotificationsPanel';
import { AppHeader } from '@/components/AppShell/AppHeader';
import { MobileTopBar } from '@/components/AppShell/MobileTopBar';
import { OPEN_ACCOUNT_MENU_EVENT } from '@/lib/constants/accountMenu';
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

  // Updated design: 980px from the right under the top bar over a dimmed page on
  // desktop; full screen above the tab bar on phones.
  return (
    <>
      {chatOpen && (
        <div
          className="qv-panel-scrim"
          aria-hidden="true"
          data-testid="messages-scrim"
          onClick={() => setChatOpen(false)}
        />
      )}
      <Sheet open={chatOpen} onOpenChange={setChatOpen} modal={false}>
        <SheetContent
          side="right"
          className="qv-msg-panel font-redesign"
          data-testid="messages-panel"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <SheetTitle className="sr-only">Messages</SheetTitle>
          <ChatContent />
        </SheetContent>
      </Sheet>
    </>
  );
}

const MENU_ITEM =
  'flex h-14 items-center gap-3.5 rounded-[14px] px-3.5 text-[15.5px] font-bold text-[var(--shell-ink)] no-underline hover:bg-[var(--shell-hover)] focus-visible:outline-2 focus-visible:outline-[var(--shell-blue)] [.neo-brutalism_&]:rounded-[4px]';
const MENU_ICON = 'flex size-[38px] shrink-0 items-center justify-center rounded-[12px] [.neo-brutalism_&]:rounded-[4px]';

function MenuIcon({ children, fill }: { children: React.ReactNode; fill?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth="2" aria-hidden="true">
      {children}
    </svg>
  );
}

/** Phone account menu (redesign, MenuMobile): a bottom sheet with the member at the top. */
function AuthenticatedAccountSheet({
  open,
  onOpenChange,
  isAdmin,
  onLogout,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  onLogout: () => void;
  user: ShellUser | null;
}) {
  const close = () => onOpenChange(false);
  const status = useAppStore((s) => s.chat.userStatus || 'online');
  const statusLabel = status === 'dnd' ? 'Do Not Disturb' : status.charAt(0).toUpperCase() + status.slice(1);
  const chevron = <span className="ml-auto text-[#94a3b8]" aria-hidden="true">›</span>;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        overlayClassName="z-[70] bg-[rgba(15,23,42,0.36)] backdrop-blur-[3px]"
        className="z-[70] gap-1.5 rounded-t-[26px] border-0 bg-[var(--shell-surface)] px-3.5 pt-2.5 pb-[calc(30px+env(safe-area-inset-bottom,0px))] font-redesign shadow-[0_-20px_40px_-20px_rgba(15,23,42,0.4)] [.neo-brutalism_&]:rounded-t-[4px] [.neo-brutalism_&]:border-t-2 [.neo-brutalism_&]:border-[var(--shell-line)]"
      >
        <span aria-hidden="true" className="mb-2 h-[5px] w-10 self-center rounded-[3px] bg-[#d3d9e4]" />
        <SheetHeader className="sr-only p-0">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="mb-1.5 flex items-center gap-3 border-b border-[var(--shell-divider)] px-3.5 pt-1.5 pb-3.5">
          {user && (
            <span className="relative shrink-0">
              <DisplayAvatar avatar={user.avatar} username={user.avatarSeed} size={44} className="size-11" />
              <span aria-hidden="true" className="absolute -right-px -bottom-px size-3 rounded-full border-[2.5px] border-[var(--shell-surface)] bg-[#22c38e]" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <b className="text-base">{user?.avatarSeed || user?.username}</b>
            <br />
            <span className="text-[12.5px] font-semibold text-[var(--shell-muted)]">
              @{user?.username} · {statusLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="flex size-11 items-center justify-center rounded-[12px] text-[var(--shell-ink-2)] hover:bg-[var(--shell-hover)]"
          >
            <MenuIcon>
              <path d="M6 6l12 12M18 6 6 18" strokeWidth="2.2" />
            </MenuIcon>
          </button>
        </div>
        <nav className="flex flex-col gap-1.5" aria-label="Account menu" data-testid="authenticated-account-menu">
          <Link href="/settings" onClick={close} className={MENU_ITEM}>
            <span className={`${MENU_ICON} bg-[#eff4ff] text-[#2457e6] [.dark_&]:bg-[#111d36] [.dark_&]:text-[#8cc8ff]`}>
              <MenuIcon>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
              </MenuIcon>
            </span>
            Settings
            {chevron}
          </Link>
          {isAdmin && (
            <Link href="/control-panel" onClick={close} className={MENU_ITEM}>
              <span className={`${MENU_ICON} bg-[#eef9f3] text-[#0f7d56] [.dark_&]:bg-[#0f2219] [.dark_&]:text-[#3fbf87]`}>
                <MenuIcon>
                  <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
                </MenuIcon>
              </span>
              Admin Panel
              {chevron}
            </Link>
          )}
          <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" onClick={close} className={MENU_ITEM}>
            <span className={`${MENU_ICON} bg-[#fff9e6] text-[#875a0e] [.dark_&]:bg-[#241f0e] [.dark_&]:text-[#f6c343]`}>
              <MenuIcon fill>
                <path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" />
              </MenuIcon>
            </span>
            Donate
            {chevron}
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" onClick={close} className={MENU_ITEM}>
            <span className={`${MENU_ICON} bg-[#f5f0fe] text-[#6d3fd1] [.dark_&]:bg-[#1a1530] [.dark_&]:text-[#c7b3ff]`}>
              <MenuIcon>
                <path d="m8 7-5 5 5 5M16 7l5 5-5 5" strokeWidth="2.2" />
              </MenuIcon>
            </span>
            GitHub
            {chevron}
          </a>
          <div className="mx-3.5 my-1.5 h-px bg-[var(--shell-divider)]" role="separator" />
          <button
            type="button"
            className={`${MENU_ITEM} w-full border-0 bg-transparent text-left text-[#a12424]! [.dark_&]:text-[#ff9a9a]!`}
            onClick={() => {
              close();
              onLogout();
            }}
          >
            <span className={`${MENU_ICON} bg-[#fdecec] text-[#c42b2b] [.dark_&]:bg-[#3a1a1e]`}>
              <MenuIcon>
                <path d="M15 4h4v16h-4M10 17l5-5-5-5M15 12H3" />
              </MenuIcon>
            </span>
            Sign Out
          </button>
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
  // On a phone, a profile has no top bar: the menu button sits on its banner (redesign).
  const bannerMenu = loggedIn && /^\/profile(\/[^/]+)?\/?$/.test(pathname);

  useEffect(() => {
    const open = () => setMenuOpen(true);
    window.addEventListener(OPEN_ACCOUNT_MENU_EVENT, open);
    return () => window.removeEventListener(OPEN_ACCOUNT_MENU_EVENT, open);
  }, []);
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

      {!bannerMenu && (
        <MobileTopBar
          isPostDetail={isMobilePostDetail}
          loggedIn={loggedIn}
          onBack={() => router.back()}
          onShare={handleSharePost}
          onSearch={handleMobileSearch}
          onOpenMenu={() => setMenuOpen(true)}
        />
      )}

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
          bannerMenu && 'max-md:pt-0',
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
              // The avatar editor (#656) uses a two-column layout on desktop. The other
              // profile and settings pages (redesign) set their own widths, and the
              // profile banner runs edge to edge.
              /^\/profile\/[^/]+\/avatar\/?$/.test(pathname) ? 'max-w-[1232px]' : 'max-w-none px-0',
            )}
          >
            {children}
          </div>
        ) : (
          <div
            className={cn(
              'mx-auto px-0 md:px-4',
              pathname === '/' && 'h-full min-h-0 md:h-auto',
              pathname.startsWith('/post/') && 'md:px-0 h-full md:h-auto',
            )}
            style={{
              // Home lays out its own columns (left filters, feed, highlights).
              // Home and the post page lay out their own full-width columns, and
              // Manage Invites has its table and summary columns.
              maxWidth:
                pathname.startsWith('/control-panel') ||
                pathname.startsWith('/manage-invites') ||
                pathname === '/' ||
                pathname.startsWith('/post/')
                  ? 'none'
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
          user={shellUser}
        />
      )}

      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className={SUBMIT_POST_DIALOG_CLASS}
          overlayClassName={SUBMIT_POST_OVERLAY_CLASS} showCloseButton={false}>
          <DialogTitle className="sr-only">Create Quotes</DialogTitle>
          <SubmitPost setOpen={setSubmitDialogOpen} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
