import type { IconProps } from '@/types/icons';
import { cn } from '@/lib/utils';

/**
 * Down icon component
 * Custom SVG icon migrated from Material UI
 */
export function Down({
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
      viewBox="0 0 5400 5630"
      fill={typeof fillValue === 'string' ? fillValue : 'currentColor'}
      className={cn('inline-block', className)}
      {...props}
    >
      <g
        transform="translate(0.000000,563.000000) scale(0.100000,-0.100000)"
        fill={color || '#000000'}
        stroke="none"
      >
        <path
          d="M110 2830 l0 -2700 2700 0 2700 0 0 2700 0 2700 -2700 0 -2700 0 0
          -2700z m3335 1050 l635 635 207 -208 208 -207 -635 -635 -635 -635 635 -635
          635 -635 -208 -207 -207 -208 -635 635 -635 635 -635 -635 -635 -635 -207 208
          -208 207 635 635 635 635 -638 638 -637 637 207 208 208 207 637 -637 638
          -638 635 635z"
        />
      </g>
    </svg>
  );
}

export default Down;

