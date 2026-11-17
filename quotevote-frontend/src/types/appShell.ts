export type ShellAvatar = string | Record<string, unknown> | undefined;

export interface ShellUser {
  username: string;
  avatar: ShellAvatar;
  avatarSeed: string | undefined;
  isAdmin: boolean;
}

export interface ShellCounts {
  unreadMessages: number;
  unreadNotifications: number;
}

export interface ShellPanels {
  chatOpen: boolean;
  notificationsOpen: boolean;
  onToggleChat: () => void;
  onToggleNotifications: () => void;
}

export interface AppHeaderProps {
  user: ShellUser | null;
  counts: ShellCounts;
  panels: ShellPanels;
  onCreate: () => void;
  onSignIn: () => void;
  onLogout: () => void;
}

export interface MobileTopBarProps {
  isPostDetail: boolean;
  loggedIn: boolean;
  onBack: () => void;
  onShare: () => void;
  onSearch: () => void;
  onOpenMenu: () => void;
}

export interface MobileTabBarProps {
  user: ShellUser | null;
  counts: ShellCounts;
  panels: ShellPanels;
  homeActive: boolean;
  profileActive: boolean;
  createActive: boolean;
  hidden: boolean;
  onHome: () => void;
  onCreate: () => void;
  onSignIn: () => void;
}

export interface CountBadgeProps {
  count: number;
  className?: string;
}

export interface WordmarkProps {
  className?: string;
}
