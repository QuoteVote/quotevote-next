'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/store'
import type { ActivityEmptyListProps } from '@/types/activity'
import Image from 'next/image'

export function ActivityEmptyList({}: ActivityEmptyListProps) {
  const router = useRouter()
  const setSelectedPage = useAppStore((state) => state.setSelectedPage)

  const handleGoToSearch = () => {
    setSelectedPage('1')
    router.push('/search')
  }

  return (
    <div className="w-full sm:w-[90%] text-center mx-auto my-5 sm:my-0">
      <Card className="bg-transparent border-0 shadow-none">
        <CardContent className="pt-6">
          <p className="w-full sm:w-[45%] mx-auto mb-5 sm:mt-5 text-base text-muted-foreground">
            Welcome to Quote Vote. To read some ideas you need to start following people. You can find your friends or you
            could go to the search page and follow anyone.
          </p>
          
          <div className="flex justify-center mb-5">
            <Image
              alt="Add Buddy / Find Posts"
              src="/assets/ActivityFind.svg"
              width={300}
              height={200}
              className="sm:h-[130px]"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="secondary" className="w-full sm:w-auto">
              FIND FRIENDS
            </Button>
            <Button
              variant="default"
              className="w-full sm:w-auto bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
              onClick={handleGoToSearch}
            >
              GO TO SEARCH
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

