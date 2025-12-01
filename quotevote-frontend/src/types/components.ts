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

