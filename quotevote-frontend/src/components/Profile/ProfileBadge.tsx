'use client';

import {
  Verified,
  Star,
  Award,
  Shield,
} from 'lucide-react';
import Image from 'next/image';
import type {
  ProfileBadgeProps,
  ProfileBadgeContainerProps,
  BadgeType,
} from '@/types/profile';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Badge type configurations
const BADGE_CONFIGS: Record<
  BadgeType,
  {
    label: string;
    description: string;
    backgroundColor: string;
    icon: React.ComponentType<{ className?: string }> | 'custom';
  }
> = {
  contributor: {
    label: 'Founder Badge',
    description: 'Early contributor and supporter of Quote.Vote',
    backgroundColor: '#ea4c89',
    icon: 'custom',
  },
  verified: {
    label: 'Verified User',
    description: 'Verified member of the Quote.Vote community',
    backgroundColor: '#1DA1F2',
    icon: Verified,
  },
  moderator: {
    label: 'Moderator',
    description: 'Community moderator helping maintain quality discussions',
    backgroundColor: '#7C3AED',
    icon: Shield,
  },
  topContributor: {
    label: 'Top Contributor',
    description: 'Recognized for exceptional contributions to the community',
    backgroundColor: '#F59E0B',
    icon: Award,
  },
  earlyAdopter: {
    label: 'Early Adopter',
    description: 'Joined Quote.Vote in its early days',
    backgroundColor: '#10B981',
    icon: Star,
  },
};

export function ProfileBadge({
  type,
  customIcon,
  customLabel,
  customDescription,
}: ProfileBadgeProps) {
  const config = BADGE_CONFIGS[type] || BADGE_CONFIGS.contributor;
  const backgroundColor = config.backgroundColor;
  const label = customLabel || config.label || 'Badge';
  const description = customDescription || config.description || '';
  const IconComponent = config.icon;

  const renderBadgeContent = () => {
    // Custom image badge (like contributor badge)
    if (type === 'contributor' || customIcon) {
      return (
        <Image
          src={customIcon || '/assets/badge.png'}
          alt={label}
          width={28}
          height={28}
          className="object-contain"
        />
      );
    }

    // Icon badge
    if (IconComponent && IconComponent !== 'custom') {
      return (
        <IconComponent className="w-7 h-7 text-white sm:w-6 sm:h-6" />
      );
    }

    // Fallback to star icon
    return <Star className="w-7 h-7 text-white sm:w-6 sm:h-6" />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative inline-flex items-center justify-center',
              'w-12 h-12 sm:w-10 sm:h-10',
              'rounded-full border-2 border-white',
              'cursor-pointer transition-all duration-200',
              'shadow-md hover:scale-110 hover:shadow-lg',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
            )}
            style={{ backgroundColor }}
            role="img"
            aria-label={`${label}: ${description}`}
            tabIndex={0}
          >
            {renderBadgeContent()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-[220px]">
            <strong>{label}</strong>
            {description && (
              <>
                <br />
                {description}
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Container component for multiple badges
export function ProfileBadgeContainer({
  children,
}: ProfileBadgeContainerProps) {
  return (
    <div
      className="inline-flex items-center gap-2 flex-wrap ml-2 sm:ml-0 sm:mt-1 sm:justify-center"
      role="list"
      aria-label="User badges"
    >
      {children}
    </div>
  );
}

