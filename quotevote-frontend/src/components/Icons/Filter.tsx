import type { IconProps } from '@/types/icons';
import { cn } from '@/lib/utils';

/**
 * Filter icon component
 * Custom SVG icon migrated from Material UI
 */
export function Filter({
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
      viewBox="0 0 32 32"
      fill={typeof fillValue === 'string' ? fillValue : 'currentColor'}
      className={cn('inline-block', className)}
      {...props}
    >
      <path d="M31.8801 0.478938C31.7142 0.183188 31.4016 0 31.0625 0H0.937492C0.598367 0 0.285617 0.183188 0.119742 0.478938C-0.0460076 0.774688 -0.0393201 1.137 0.137555 1.42631L11.0457 19.2763V28.05C11.0457 28.4408 11.2882 28.7906 11.654 28.9278L19.6873 31.9403C19.794 31.9804 19.9056 32 20.0164 32C20.2048 32 20.3914 31.9433 20.5505 31.8331C20.8033 31.6579 20.9541 31.37 20.9541 31.0625V19.2763L31.8624 1.42638C32.0393 1.137 32.046 0.77475 31.8801 0.478938Z" />
    </svg>
  );
}

export default Filter;

