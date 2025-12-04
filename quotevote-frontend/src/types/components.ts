export interface LoadingSpinnerProps {
  /**
   * Size of the spinner in pixels
   * @default 80
   */
  size?: number;
  /**
   * Top margin for the spinner container
   * @default '15px'
   */
  marginTop?: string;
  
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * URL of the avatar image
   */
  src?: string;
  /**
   * Alt text for the image (required for accessibility)
   */
  alt?: string;
  /**
   * Fallback content when image is missing or fails to load.
   * Can be a string (typically initials) or a React node.
   * If not provided, initials will be generated from alt text.
   */
  fallback?: string | React.ReactNode;
  /**
   * Size variant: 'sm', 'md', 'lg', 'xl', or a custom number in pixels
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  /**
   * Optional click handler
   */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export type AlertVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual variant of the alert
   * @default 'default'
   */
  variant?: AlertVariant;
}

export type AlertTitleProps = React.HTMLAttributes<HTMLDivElement>;

export type AlertDescriptionProps = React.HTMLAttributes<HTMLDivElement>;

export interface AlertItem {
  /**
   * Unique identifier for the alert
   */
  id: string;
  /**
   * Visual variant of the alert
   * @default 'default'
   */
  variant?: AlertVariant;
  /**
   * Title text for the alert
   */
  title?: string;
  /**
   * Description text for the alert
   */
  description?: string;
  /**
   * Optional dismiss handler function
   */
  onDismiss?: (id: string) => void;
}

export interface AlertListProps {
  /**
   * Array of alert items to display
   */
  alerts: AlertItem[];
  /**
   * Whether the component is in a loading state
   * @default false
   */
  loading?: boolean;
  /**
   * Number of skeleton loaders to show when loading
   * @default 3
   */
  skeletonLimit?: number;
  /**
   * Message to display when there are no alerts
   */
  emptyMessage?: string;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

export interface LoaderProps {
  /**
   * Size of the loader spinner
   * @default 40
   */
  size?: number;
  /**
   * Custom loader styles
   */
  loaderStyle?: React.CSSProperties;
  /**
   * Whether to merge custom styles with default styles
   * @default false
   */
  mergeStyles?: boolean;
  /**
   * Whether the loader should be absolutely positioned
   * @default true
   */
  absolutelyPositioned?: boolean;
  /**
   * Additional props for the spinner wrapper
   * Includes all standard div attributes plus data-* attributes
   */
  PulseLoaderProps?: React.HTMLAttributes<HTMLDivElement> & {
    [key: `data-${string}`]: string | undefined;
  };
  /**
   * Thickness of the spinner border
   * @default 3.6
   */
  thickness?: number;
  /**
   * Optional loading label text
   */
  loadingLabel?: string;
}

export interface PaginationProps {
  /**
   * Current page number (1-indexed)
   */
  currentPage: number;
  /**
   * Total number of pages
   */
  totalPages: number;
  /**
   * Total number of items
   */
  totalCount: number;
  /**
   * Number of items per page
   */
  pageSize: number;
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;
  /**
   * Whether to show page info (e.g., "1-20 of 100")
   * @default true
   */
  showPageInfo?: boolean;
  /**
   * Whether to show first/last page buttons
   * @default true
   */
  showFirstLast?: boolean;
  /**
   * Maximum number of visible page buttons
   * @default 5
   */
  maxVisiblePages?: number;
  /**
   * Whether pagination is disabled
   * @default false
   */
  disabled?: boolean;
}

export interface StickyPaginationWrapperProps {
  /**
   * Child content to wrap
   */
  children: React.ReactNode;
  /**
   * Pagination component to display at the bottom
   */
  pagination?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export interface PaginatedListProps<T = unknown> {
  // Data props
  /**
   * Array of data items to paginate
   */
  data?: T[];
  /**
   * Whether data is currently loading
   * @default false
   */
  loading?: boolean;
  /**
   * Error object if data fetch failed
   */
  error?: Error | { message?: string };
  /**
   * Total count of items (required for pagination)
   */
  totalCount: number;
  
  // Pagination props
  /**
   * Default page size
   * @default 20
   */
  defaultPageSize?: number;
  /**
   * URL parameter name for page
   * @default 'page'
   */
  pageParam?: string;
  /**
   * URL parameter name for page size
   * @default 'page_size'
   */
  pageSizeParam?: string;
  /**
   * Whether to show page info
   * @default true
   */
  showPageInfo?: boolean;
  /**
   * Whether to show first/last page buttons
   * @default true
   */
  showFirstLast?: boolean;
  /**
   * Maximum number of visible page buttons
   * @default 5
   */
  maxVisiblePages?: number;
  
  // Render props
  /**
   * Function to render each item
   */
  renderItem?: (item: T, index: number) => React.ReactNode;
  /**
   * Custom empty state renderer
   */
  renderEmpty?: () => React.ReactNode;
  /**
   * Custom error state renderer
   */
  renderError?: (error: Error | { message?: string }, onRefresh?: () => void) => React.ReactNode;
  /**
   * Custom loading state renderer
   */
  renderLoading?: () => React.ReactNode;
  
  // Callbacks
  /**
   * Callback when page changes
   */
  onPageChange?: (page: number) => void;
  /**
   * Callback when page size changes
   */
  onPageSizeChange?: (pageSize: number) => void;
  /**
   * Callback to refresh/retry data fetch
   */
  onRefresh?: () => void;
  
  // Styling
  /**
   * Additional CSS classes for root container
   */
  className?: string;
  /**
   * Additional CSS classes for content area
   */
  contentClassName?: string;
  /**
   * Additional CSS classes for pagination
   */
  paginationClassName?: string;
  
  // Other props
  /**
   * Child content (alternative to renderItem)
   */
  children?: React.ReactNode;
}

export interface SEOHeadProps {
  /**
   * Page title
   */
  title?: string;
  /**
   * Page description
   */
  description?: string;
  /**
   * Canonical URL
   */
  canonicalUrl?: string;
  /**
   * Previous page URL (for pagination)
   */
  prevUrl?: string;
  /**
   * Next page URL (for pagination)
   */
  nextUrl?: string;
  /**
   * Keywords meta tag
   */
  keywords?: string;
  /**
   * Open Graph image URL
   */
  ogImage?: string;
  /**
   * Open Graph type
   * @default 'website'
   */
  ogType?: string;
  /**
   * Whether to set noindex, nofollow
   * @default false
   */
  noIndex?: boolean;
}

// CustomButtons Component Types
export interface AdminIconButtonProps {
  /**
   * Font size for the icon
   * @default 'default'
   */
  fontSize?: string;
  /**
   * Callback function called before navigation (e.g., to close mobile drawer)
   */
  onNavigate?: () => void;
}

export interface DoubleArrowIconButtonProps {
  /**
   * Click handler function
   */
  onClick?: () => void;
}

export interface BookmarkIconButtonProps {
  /**
   * Post object with _id and bookmarkedBy array
   */
  post: {
    _id: string;
    bookmarkedBy?: string[];
  };
  /**
   * User object with _id
   */
  user: {
    _id: string;
  };
  /**
   * Limit for queries
   */
  limit?: number;
}

export interface ApproveButtonProps extends React.ComponentProps<'button'> {
  /**
   * Whether the button is in selected/active state
   * @default false
   */
  selected?: boolean;
  /**
   * Count to display
   * @default 0
   */
  count?: number;
}

export interface RejectButtonProps extends React.ComponentProps<'button'> {
  /**
   * Whether the button is in selected/active state
   * @default false
   */
  selected?: boolean;
  /**
   * Count to display
   * @default 0
   */
  count?: number;
}

export interface ManageInviteButtonProps extends React.ComponentProps<'button'> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

export interface InvestButtonProps {
  /**
   * Click handler function
   */
  handleClick?: () => void;
  /**
   * Width breakpoint ('xs', 'sm', etc.)
   */
  width?: string;
}

export interface SignOutButtonProps extends React.ComponentProps<'button'> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

// GetAccessButton has no props - it's a self-contained button
export type GetAccessButtonProps = Record<string, never>;

export interface SettingsSaveButtonProps extends React.ComponentProps<'button'> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

export interface FollowButtonProps {
  /**
   * Whether the user is currently following
   */
  isFollowing: boolean;
  /**
   * Username of the profile being followed/unfollowed
   */
  username?: string;
  /**
   * User ID of the profile being followed/unfollowed
   */
  profileUserId: string;
  /**
   * Whether to show as icon-only button
   * @default false
   */
  showIcon?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export interface SettingsIconButtonProps {
  /**
   * Font size for the icon
   */
  fontSize?: string;
}

export type SelectPlansButtonProps = React.ComponentProps<'button'>;

// Navbar Component Types
// MainNavBar doesn't require props - it reads from store
export type MainNavBarProps = Record<string, never>;

export interface AuthNavbarProps {
  /**
   * Color variant for the navbar
   */
  color?: 'primary' | 'info' | 'success' | 'warning' | 'danger';
  /**
   * Brand text to display
   */
  brandText?: string;
}

export interface NavItem {
  /**
   * Display name of the navigation item
   */
  name: string;
  /**
   * Route path for the navigation item
   */
  href: string;
  /**
   * Icon component for the navigation item
   */
  icon?: React.ComponentType<{ className?: string }>;
  /**
   * Whether to show this item in mobile menu
   * @default true
   */
  showInMobile?: boolean;
}

export interface ProfileHeaderProps {
  /**
   * Profile user object
   */
  profileUser: {
    _id: string;
    username: string;
    _followingId?: string[];
    _followersId?: string[];
    avatar?: string;
    contributorBadge?: boolean;
    [key: string]: unknown;
  };
  /**
   * Logged in user object (optional, will be read from store if not provided)
   */
  loggedInUser?: {
    _id: string;
    [key: string]: unknown;
  };
}

// Sidebar Component Types
export interface SidebarProps {
  /**
   * Whether the sidebar is open
   */
  open: boolean;
  /**
   * Callback to toggle sidebar open/close state
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Background color variant
   * @default 'blue'
   */
  bgColor?: 'white' | 'black' | 'blue';
  /**
   * Whether RTL (right-to-left) mode is active
   * @default false
   */
  rtlActive?: boolean;
  /**
   * Color variant for the sidebar
   */
  color?: 'white' | 'red' | 'orange' | 'green' | 'blue' | 'purple' | 'rose';
  /**
   * Whether mini sidebar mode is active
   * @default false
   */
  miniActive?: boolean;
}

export interface SidebarWrapperProps {
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * User section content
   */
  user?: React.ReactNode;
  /**
   * Header links section content
   */
  headerLinks?: React.ReactNode;
  /**
   * Navigation links section content
   */
  links?: React.ReactNode;
}

export interface SubHeaderProps {
  /**
   * The header text to display
   */
  headerName: string;
  /**
   * Whether to show the filter icon button
   * @default true
   */
  showFilterIconButton?: boolean;
  /**
   * Callback function to set offset (currently unused)
   */
  setOffset?: (offset: number) => void;
}

export interface ForgotPasswordFormProps {
  onSubmit: (data: { email: string }) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export interface ForgotPasswordProps {
  onSubmit?: (data: { email: string }) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export interface PasswordResetFormProps {
  onSubmit: (data: { password: string; confirmPassword: string }) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  token?: string;
}

export interface PasswordResetProps {
  onSubmit?: (data: { password: string; confirmPassword: string }) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  token?: string;
  loadingData?: boolean;
  passwordUpdated?: boolean;
  isValidToken?: boolean;
}

