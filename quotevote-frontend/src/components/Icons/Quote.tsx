import type { IconProps } from '@/types/icons';
import { cn } from '@/lib/utils';

/**
 * Quote icon component
 */
export function Quote({
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
      viewBox="0 0 693 605"
      fill={typeof fillValue === 'string' ? fillValue : 'currentColor'}
      className={cn('inline-block', className)}
      {...props}
    >
      <g
        transform="translate(0.000000,605.000000) scale(0.100000,-0.100000)"
        fill={color || '#000000'}
        stroke="none"
      >
        <path
          d="M66 5224 l-26 -27 0 -1247 0 -1247 26 -27 27 -26 768 0 c423 0 769
        -2 769 -4 0 -25 -35 -158 -55 -212 -77 -206 -249 -393 -450 -489 -88 -42 -247
        -85 -319 -85 -73 -1 -128 -16 -148 -41 -17 -19 -18 -57 -18 -469 l0 -447 28
        -28 27 -27 150 5 c445 15 884 205 1218 526 295 284 488 649 557 1054 19 115
        20 162 20 1437 l0 1318 -26 31 -26 31 -1248 0 -1247 0 -27 -26z"
        />
        <path
          d="M3466 5224 l-26 -27 0 -1247 0 -1247 26 -27 27 -26 768 0 c423 0 769
        -2 769 -4 0 -25 -35 -158 -55 -212 -77 -206 -249 -393 -450 -489 -88 -42 -247
        -85 -319 -85 -73 -1 -128 -16 -148 -41 -17 -19 -18 -57 -18 -469 l0 -447 28
        -28 27 -27 150 5 c445 15 884 205 1218 526 295 284 488 649 557 1054 19 115
        20 162 20 1437 l0 1318 -26 31 -26 31 -1248 0 -1247 0 -27 -26z"
        />
      </g>
    </svg>
  );
}

export default Quote;

