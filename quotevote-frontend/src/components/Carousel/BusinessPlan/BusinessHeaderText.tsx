import type { CarouselContentProps } from '@/types/carousel'

interface BusinessHeaderTextProps extends CarouselContentProps {
  index: number
}

export function BusinessHeaderText({ classes, index }: BusinessHeaderTextProps) {
  const { greenTitleText } = classes || {}

  return (
    <>
      {index === 0 && (
        <>
          Highlight text, <span className={greenTitleText || 'text-[#52b274]'}>discuss decisions</span>
        </>
      )}
      {index === 1 && (
        <>
          Every team on the <span className={greenTitleText || 'text-[#52b274]'}>Same Page</span>
        </>
      )}

      {index === 2 && (
        <>
          Equal Teams, <span className={greenTitleText || 'text-[#52b274]'}>Quality Teamwork</span>
        </>
      )}
    </>
  )
}

