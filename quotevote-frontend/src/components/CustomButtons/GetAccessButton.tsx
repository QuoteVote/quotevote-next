'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { GetAccessButtonProps } from '@/types/components';

/**
 * GetAccessButton Component
 * 
 * Button that navigates to the request access page.
 */
export function GetAccessButton({}: GetAccessButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push('/auth/request-access');
  };

  return (
    <Button
      variant="default"
      onClick={handleClick}
      className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded-lg"
    >
      Get Access
    </Button>
  );
}

