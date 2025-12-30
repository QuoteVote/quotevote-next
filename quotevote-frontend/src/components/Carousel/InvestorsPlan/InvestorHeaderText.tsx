import type { CarouselContentProps } from '@/types/carousel'

interface InvestorHeaderTextProps extends CarouselContentProps {
  index: number
}

export function InvestorHeaderText({ classes, index }: InvestorHeaderTextProps) {
  const { greenTitleText } = classes || {}

  return (
    <>
      {index === 0 && (
        <>
          Shape Quote Vote & <span className={greenTitleText || 'text-[#52b274]'}>Help it Scale</span>
        </>
      )}
      {index === 1 && (
        <>
          All Voices Equal, <span className={greenTitleText || 'text-[#52b274]'}>All Voices Heard</span>
        </>
      )}

      {index === 2 && (
        <>
          Together for <span className={greenTitleText || 'text-[#52b274]'}>Change</span>
        </>
      )}
    </>
  )
}

