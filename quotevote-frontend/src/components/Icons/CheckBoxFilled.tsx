import type { IconProps } from '@/types/icons';
import { cn } from '@/lib/utils';

/**
 * CheckBoxFilled icon component
 * Custom SVG icon migrated from Material UI
 */
export function CheckBoxFilled({
  size = 24,
  className,
  color,
  fill,
  ...props
}: IconProps) {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;
  const fillValue = color || fill || 'currentColor';
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={sizeValue}
      height={sizeValue}
      viewBox="0 0 24 24"
      fill={typeof fillValue === 'string' ? fillValue : 'currentColor'}
      className={cn('inline-block', className)}
      {...props}
    >
      <path d="M0 0h24v24H0z" fill="none" />
      <path d="M19 3H5c-1.11 0-2 .9-2  2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}

export default CheckBoxFilled;

