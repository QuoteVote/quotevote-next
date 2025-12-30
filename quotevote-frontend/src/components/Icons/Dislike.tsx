import type { IconProps } from '@/types/icons'
import { cn } from '@/lib/utils'

/**
 * Dislike icon component (downvote)
 */
export function Dislike({
  size = 30,
  className,
  color,
  fill,
  ...props
}: IconProps) {
  const sizeValue = typeof size === 'number' ? `${size}px` : size
  const fillValue = color || fill || 'currentColor'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={sizeValue}
      height={sizeValue}
      fill="none"
      viewBox="0 0 29 26"
      className={cn('inline-block', className)}
      {...props}
    >
      <path
        fill={fillValue === 'currentColor' ? '#F44336' : fillValue}
        d="M4.882 13.816V1.731H.451c-.25 0-.451.202-.451.451v11.184c0 .248.202.45.45.45h4.432z"
      />
      <path
        fill={fillValue === 'currentColor' ? '#FFC197' : fillValue}
        d="M28.016 15.045v-1.07c0-.852-.69-1.543-1.543-1.543h-.876c.742-.053 1.329-.67 1.329-1.425V9.81c0-.79-.641-1.431-1.432-1.431h-1.226c.713 0 1.292-.578 1.292-1.292v-1.03c0-.714-.579-1.293-1.292-1.293h-1.189c.714 0 1.292-.579 1.292-1.293v-.769c0-.713-.578-1.292-1.292-1.292H5.719v12.494c2.005 0 3.616.201 4.907.55 4.133 1.116 4.993 3.733 4.993 6.027v4.223c0 .274.111.523.29.703.18.18.428.291.703.291 1.768 0 3.201-1.433 3.201-3.2v-4.137c0-.98.794-1.773 1.773-1.773h4.887c.852 0 1.543-.691 1.543-1.544z"
      />
      <path
        fill={fillValue === 'currentColor' ? '#F44336' : fillValue}
        d="M8.734.283H3.437c-.25 0-.451.202-.451.451v14.079c0 .249.202.45.45.45h5.298c.249 0 .45-.201.45-.45V.734c0-.249-.201-.45-.45-.45z"
      />
    </svg>
  )
}

export default Dislike

