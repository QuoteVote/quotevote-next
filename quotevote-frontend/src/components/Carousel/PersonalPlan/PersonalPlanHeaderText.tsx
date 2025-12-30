import type { CarouselContentProps } from '@/types/carousel'

interface PersonalPlanHeaderTextProps extends CarouselContentProps {
  index: number
}

export function PersonalPlanHeaderText({ classes, index }: PersonalPlanHeaderTextProps) {
  const { greenTitleText } = classes || {}

  return (
    <>
      {index === 0 && (
        <>
          What is{' '}
          <span className={greenTitleText || 'text-[#52b274]'}>Quote Vote</span>
        </>
      )}
      {index === 1 && (
        <>
          Share <span className={greenTitleText || 'text-[#52b274]'}>a thought</span>, get
          feedback
        </>
      )}

      {index === 2 && (
        <>
          Share <span className={greenTitleText || 'text-[#52b274]'}>your voice</span>,{' '}
          democratically
        </>
      )}

      {index === 3 && (
        <>
          <span className={greenTitleText || 'text-[#52b274]'}>Trending</span> with no bias
        </>
      )}
    </>
  )
}

