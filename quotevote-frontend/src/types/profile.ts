/**
 * TypeScript type definitions for Profile components
 * All profile-related types are defined here
 */

export type BadgeType =
  | 'contributor'
  | 'verified'
  | 'moderator'
  | 'topContributor'
  | 'earlyAdopter';

export interface ProfileBadgeProps {
  type: BadgeType;
  customIcon?: string;
  customLabel?: string;
  customDescription?: string;
}

export interface ProfileBadgeContainerProps {
  children: React.ReactNode;
}

export interface ReputationMetrics {
  totalInvitesSent: number;
  totalInvitesAccepted: number;
  totalInvitesDeclined: number;
  averageInviteeReputation: number;
  totalReportsReceived: number;
  totalReportsResolved: number;
  totalUpvotes: number;
  totalDownvotes: number;
  totalPosts: number;
  totalComments: number;
}

export interface Reputation {
  _id: string;
  overallScore: number;
  inviteNetworkScore: number;
  conductScore: number;
  activityScore: number;
  metrics: ReputationMetrics;
  lastCalculated: string;
}

export interface User {
  _id: string;
  name?: string;
  username: string;
  email?: string;
  avatar?: string | {
    url?: string;
    [key: string]: unknown;
  };
  contributorBadge?: boolean;
  _followingId?: string[];
  _followersId?: string[];
  upvotes?: number;
  downvotes?: number;
  reputation?: Reputation;
  [key: string]: unknown;
}

export interface ProfileUser extends User {
  _id: string;
  username: string;
  _followingId?: string[];
  _followersId?: string[];
  avatar?: string | {
    url?: string;
    [key: string]: unknown;
  };
  contributorBadge?: boolean;
  reputation?: Reputation;
}

export interface ReputationDisplayProps {
  reputation?: Reputation;
  onRefresh?: () => void;
  loading?: boolean;
}

export interface ProfileAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
}

export interface UserFollowDisplayProps {
  avatar?: string | {
    url?: string;
    [key: string]: unknown;
  };
  username: string;
  numFollowers: number;
  numFollowing: number;
  id: string;
  isFollowing: boolean;
  profileUserId: string;
}

export interface FollowInfoProps {
  filter: 'followers' | 'following';
}

export interface NoFollowersProps {
  filter: 'followers' | 'following';
}

export interface ReportUserDialogProps {
  open: boolean;
  onClose: () => void;
  reportedUser: {
    _id: string;
    username?: string;
    name?: string;
  };
}

export interface SendInviteDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface ProfileViewProps {
  handleActivityEvent?: (event: unknown, newActivityEvent: string[]) => void;
  handleSelectAll?: (event: unknown, newSelectAll: string[]) => void;
  selectAll?: string | string[];
  filterState?: {
    filter?: {
      visibility?: boolean;
      value?: string | string[];
    };
    date?: {
      visibility?: boolean;
      value?: string;
    };
    search?: {
      visibility?: boolean;
      value?: string;
    };
  };
  setOffset?: (offset: number) => void;
  profileUser?: ProfileUser;
  limit?: number;
  offset?: number;
  selectedEvent?: string[];
  loading?: boolean;
}

export interface ProfileControllerProps {
  username?: string;
}

