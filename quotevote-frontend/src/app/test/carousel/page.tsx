'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Carousel } from '@/components/Carousel'
import { PersonalPlanCarousel } from '@/components/Carousel/PersonalPlan'
import { BusinessPlanCarousel } from '@/components/Carousel/BusinessPlan'
import { InvestorPlanCarousel } from '@/components/Carousel/InvestorsPlan'

/**
 * Test Page for Carousel Components
 *
 * This page showcases all carousel variants:
 * - Basic carousel with sample slides
 * - PersonalPlanCarousel
 * - BusinessPlanCarousel
 * - InvestorPlanCarousel
 */
export default function CarouselTestPage() {
  const [carouselIndex, setCarouselIndex] = useState(0)

  const sampleSlides = [
    <div key="1" className="flex items-center justify-center h-64 bg-blue-100">
      <p className="text-2xl font-bold">Slide 1</p>
    </div>,
    <div key="2" className="flex items-center justify-center h-64 bg-green-100">
      <p className="text-2xl font-bold">Slide 2</p>
    </div>,
    <div key="3" className="flex items-center justify-center h-64 bg-purple-100">
      <p className="text-2xl font-bold">Slide 3</p>
    </div>,
    <div key="4" className="flex items-center justify-center h-64 bg-yellow-100">
      <p className="text-2xl font-bold">Slide 4</p>
    </div>,
  ]

  const mockClasses = {
    activeIndicator: 'bg-primary',
    inactiveIndicator: 'bg-gray-400',
    opinionsText: 'text-base',
    bottomText: 'text-base',
    greenText: 'text-[#52b274]',
    greenTitleText: 'text-[#52b274]',
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Carousel Components Test Page</h1>
        <p className="text-muted-foreground">
          Test all carousel components with navigation, autoplay, and responsive behavior.
        </p>
      </div>

      {/* Basic Carousel */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Carousel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Basic carousel with 4 slides. Test navigation buttons, dots, keyboard navigation, and
              swipe gestures.
            </p>
            <div className="w-full max-w-4xl mx-auto">
              <Carousel
                navButtonsAlwaysVisible
                autoplay={false}
                activeStepProp={carouselIndex}
                setActiveStepProp={setCarouselIndex}
              >
                {sampleSlides}
              </Carousel>
            </div>
            <p className="text-xs text-muted-foreground">
              Current index: {carouselIndex} | Use arrow keys, click buttons, or swipe to navigate
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Carousel with Autoplay */}
      <Card>
        <CardHeader>
          <CardTitle>Carousel with Autoplay</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Carousel with autoplay enabled. Hover to pause.
            </p>
            <div className="w-full max-w-4xl mx-auto">
              <Carousel navButtonsAlwaysVisible autoplay autoplayInterval={3000} pauseOnHover>
                {sampleSlides}
              </Carousel>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PersonalPlanCarousel */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Plan Carousel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Personal plan carousel with 4 content slides.
            </p>
            <div className="w-full max-w-6xl mx-auto">
              <PersonalPlanCarousel
                classes={mockClasses}
                setCarouselCurrentIndex={(index: number) => {
                  console.log('Personal plan carousel index:', index)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BusinessPlanCarousel */}
      <Card>
        <CardHeader>
          <CardTitle>Business Plan Carousel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Business plan carousel with 3 content slides.
            </p>
            <div className="w-full max-w-6xl mx-auto">
              <BusinessPlanCarousel
                classes={mockClasses}
                setCarouselCurrentIndex={(index: number) => {
                  console.log('Business plan carousel index:', index)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* InvestorPlanCarousel */}
      <Card>
        <CardHeader>
          <CardTitle>Investor Plan Carousel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Investor plan carousel with 3 content slides including email form.
            </p>
            <div className="w-full max-w-6xl mx-auto">
              <InvestorPlanCarousel
                classes={mockClasses}
                setCarouselCurrentIndex={(index: number) => {
                  console.log('Investor plan carousel index:', index)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Navigation Testing:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Click next/previous buttons to navigate</li>
              <li>Click on dots to jump to specific slide</li>
              <li>Use keyboard arrow keys (when carousel is focused)</li>
              <li>Swipe left/right on touch devices</li>
            </ul>
            <p className="mt-4">
              <strong>Autoplay Testing:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Verify slides advance automatically</li>
              <li>Hover over carousel to pause autoplay</li>
              <li>Move mouse away to resume autoplay</li>
            </ul>
            <p className="mt-4">
              <strong>Responsive Testing:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Resize browser window to test responsive layout</li>
              <li>Navigation buttons should hide on mobile</li>
              <li>Content should adapt to different screen sizes</li>
            </ul>
            <p className="mt-4">
              <strong>Accessibility Testing:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Tab through carousel to test focus handling</li>
              <li>Use Enter/Space to activate buttons</li>
              <li>Verify ARIA labels are present</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

