'use client';

/**
 * Plans Component
 * 
 * Component for selecting plan type (Personal, Business, Investors).
 * Migrated from Material UI to shadcn/ui components.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isMobile } from 'react-device-detect';
import Image from 'next/image';

import { Button } from '@/components/ui/button';

import { useAppStore } from '@/store';
import type { PlansProps } from '@/types/components';

export function Plans({}: PlansProps) {
  const router = useRouter();
  const setSelectedPlan = useAppStore((state) => state.setSelectedPlan);
  const userData = useAppStore((state) => state.user.data);

  useEffect(() => {
    // Check if user is logged in and redirect if so
    if (userData && '_id' in userData && userData._id) {
      router.push('/search');
    }
  }, [userData, router]);

  const handlePlanSelection = (type: 'personal' | 'business' | 'investors') => {
    setSelectedPlan(type);
    router.push('/auth/plans');
  };

  const buttonList = (
    <div className="flex flex-col space-y-4 items-center justify-evenly">
      <Button
        variant="outline"
        onClick={() => handlePlanSelection('personal')}
        className="w-full max-w-xs"
      >
        Personal
      </Button>
      <Button
        variant="outline"
        onClick={() => handlePlanSelection('business')}
        className="w-full max-w-xs"
      >
        Business
      </Button>
      <Button
        variant="outline"
        onClick={() => handlePlanSelection('investors')}
        className="w-full max-w-xs"
      >
        Investors
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12">
            Select To Learn More
          </h1>

          {/* Mobile view */}
          {isMobile && buttonList}

          {/* Desktop view */}
          {!isMobile && (
            <div className="flex flex-row items-center justify-evenly w-full gap-8">
              <div className="flex flex-col items-center">
                <Image
                  className="w-[200px] h-[140px] mb-4"
                  src="/assets/PersonalPlanAvatar.png"
                  alt="personal"
                  width={200}
                  height={140}
                />
                <Button
                  variant="outline"
                  onClick={() => handlePlanSelection('personal')}
                  className="w-full max-w-xs"
                >
                  Personal
                </Button>
              </div>
              <div className="flex flex-col items-center">
                <Image
                  className="w-[200px] h-[140px] mb-4"
                  src="/assets/BusinessPlanAvatar.png"
                  alt="business"
                  width={200}
                  height={140}
                />
                <Button
                  variant="outline"
                  onClick={() => handlePlanSelection('business')}
                  className="w-full max-w-xs"
                >
                  Business
                </Button>
              </div>
              <div className="flex flex-col items-center">
                <Image
                  className="w-[200px] h-[140px] mb-4"
                  src="/assets/InvestorPlanAvatar.png"
                  alt="investor"
                  width={200}
                  height={140}
                />
                <Button
                  variant="outline"
                  onClick={() => handlePlanSelection('investors')}
                  className="w-full max-w-xs"
                >
                  Investors
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

