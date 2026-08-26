import { ActivityContentType } from '@/types/store'

/**
 * Activity Color Design System (RC1-008, RC1-009, RC1-028 / #380)
 *
 * Fill colors for profile activity cards and activity controls:
 * - POSTED: #FFFFFF (White fill; blue border chrome comes from ActivityCard)
 * - COMMENTED: #FDD835 (Yellow)
 * - UPVOTED / UP: #52b274 (Green)
 * - DOWNVOTED / DOWN: #FF6060 (Red)
 * - VOTED: #52b274 (Default green for generic vote activity)
 * - LIKED / HEARTED: #F16C99 (Pink)
 * - QUOTED: #E36DFA (Purple)
 *
 * Explore/Home feed PostCards never use these fills for chrome — they stay blue.
 */
export const ACTIVITY_COLOR_MAP = {
  POSTED: '#FFFFFF',
  COMMENTED: '#FDD835',
  UPVOTED: '#52b274',
  DOWNVOTED: '#FF6060',
  VOTED: '#52b274',
  LIKED: '#F16C99',
  QUOTED: '#E36DFA',
} as const

// ponytail: single switch statement handles all aliases without extra abstraction
const getCardBackgroundColor = (activityType: ActivityContentType): string => {
  if (!activityType) return ACTIVITY_COLOR_MAP.POSTED

  switch (activityType.toUpperCase()) {
    case 'POSTED':
    case 'POST':
      return ACTIVITY_COLOR_MAP.POSTED
    case 'COMMENTED':
    case 'COMMENT':
      return ACTIVITY_COLOR_MAP.COMMENTED
    case 'UPVOTED':
    case 'UP':
    case 'UPVOTE':
      return ACTIVITY_COLOR_MAP.UPVOTED
    case 'DOWNVOTED':
    case 'DOWN':
    case 'DOWNVOTE':
      return ACTIVITY_COLOR_MAP.DOWNVOTED
    case 'VOTED':
    case 'VOTE':
      return ACTIVITY_COLOR_MAP.VOTED
    case 'LIKED':
    case 'LIKE':
    case 'HEARTED':
      return ACTIVITY_COLOR_MAP.LIKED
    case 'QUOTED':
    case 'QUOTE':
      return ACTIVITY_COLOR_MAP.QUOTED
    default:
      return ACTIVITY_COLOR_MAP.POSTED
  }
}

export default getCardBackgroundColor

