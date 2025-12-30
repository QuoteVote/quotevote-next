/**
 * Get activity content based on activity type
 * 
 * Extracts the relevant text content from a post based on the activity type
 * (POSTED, COMMENTED, VOTED, QUOTED, LIKED)
 */

// GetActivityContentArgs type is not used but kept for future reference

export function getActivityContent(
  type: string,
  post: { text: string; [key: string]: unknown },
  quote?: { startWordIndex: number; endWordIndex: number; [key: string]: unknown },
  vote?: { startWordIndex: number; endWordIndex: number; type?: string; [key: string]: unknown },
  comment?: { startWordIndex: number; endWordIndex: number; [key: string]: unknown }
): string {
  const { text } = post
  
  if (!text) {
    return ''
  }

  switch (type.toUpperCase()) {
    case 'LIKED':
    case 'POSTED':
      return text
    case 'COMMENTED':
      if (comment && typeof comment.startWordIndex === 'number' && typeof comment.endWordIndex === 'number') {
        return text.substring(comment.startWordIndex, comment.endWordIndex).replace(/(\r\n|\n|\r)/gm, '')
      }
      return text
    case 'UPVOTED':
    case 'DOWNVOTED':
      if (vote && typeof vote.startWordIndex === 'number' && typeof vote.endWordIndex === 'number') {
        return text.substring(vote.startWordIndex, vote.endWordIndex).replace(/(\r\n|\n|\r)/gm, '')
      }
      return text
    case 'QUOTED':
      if (quote && typeof quote.startWordIndex === 'number' && typeof quote.endWordIndex === 'number') {
        return text.substring(quote.startWordIndex, quote.endWordIndex).replace(/(\r\n|\n|\r)/gm, '')
      }
      return text
    default:
      return text
  }
}

