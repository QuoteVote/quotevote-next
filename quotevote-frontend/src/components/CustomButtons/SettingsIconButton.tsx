'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApolloClient } from '@/lib/apollo';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/store';
import type { SettingsIconButtonProps } from '@/types/components';

/**
 * SettingsIconButton Component
 * 
 * Icon button with dropdown menu for settings actions.
 * Shows control panel option for admins and logout option.
 */
export function SettingsIconButton({ fontSize }: SettingsIconButtonProps) {
  const router = useRouter();
  const user = useAppStore((state) => state.user.data);
  const [open, setOpen] = useState(false);

  const iconSize = fontSize === 'small' ? 20 : fontSize === 'large' ? 28 : 24;

  const handleLogout = () => {
    setOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      const client = getApolloClient();
      client.stop();
      client.resetStore();
    }
    router.push('/auth/login');
  };

  const handleInviteControlPanel = () => {
    router.push('/hhsb/ControlPanel');
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Settings"
          className="text-inherit hover:text-[#52b274] transition-colors"
        >
          <Settings size={iconSize} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {user?.admin && (
          <DropdownMenuItem onClick={handleInviteControlPanel}>
            Control Panel
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

