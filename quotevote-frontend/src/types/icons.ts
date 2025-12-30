import type { SVGProps } from 'react';

/**
 * Base props for icon components
 * Compatible with lucide-react icon props
 */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'xmlns'> {
  /**
   * Size of the icon (width and height)
   * Can be a number (pixels) or string (e.g., "1rem", "24px")
   * @default 24
   */
  size?: number | string;
  /**
   * Color of the icon
   * Can be a CSS color value
   */
  color?: string;
  /**
   * Additional CSS class names
   */
  className?: string;
}

