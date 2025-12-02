'use client';

import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';
import type { AdminIconButtonProps } from '@/types/components';

/**
 * AdminIconButton Component
 * 
 * Icon button that navigates to the admin control panel.
 * Only renders if the current user is an admin.
 */
export function AdminIconButton({ fontSize, onNavigate }: AdminIconButtonProps) {
  const router = useRouter();
  const admin = useAppStore((state) => state.user.data?.admin);

  const handleClick = () => {
    // Call onNavigate callback first if provided (e.g., to close mobile drawer)
    if (onNavigate) {
      onNavigate();
    }
    router.push('/ControlPanel');
  };

  // Only render if user is admin
  if (!admin) {
    return null;
  }

  const iconSize = fontSize === 'small' ? 20 : fontSize === 'large' ? 28 : 24;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Admin Panel"
      onClick={handleClick}
      className="text-[#0A2342] hover:text-[#52b274] hover:scale-110 transition-all"
    >
      <Shield size={iconSize} />
    </Button>
  );
}

