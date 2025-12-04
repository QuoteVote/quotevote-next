import { GetActivityContentArgs } from "@/types/store"
const getActivityContent = ({ type, post, quote, vote, comment }: GetActivityContentArgs): string => {
  const { text } = post
  switch (type.toUpperCase()) {
    case 'LIKED':
    case 'POSTED':
      return text
    case 'COMMENTED':
      if (!comment) return text
      return text.substring(Number(comment.startWordIndex), Number(comment.endWordIndex)).replace(/(\r\n|\n|\r)/gm, '')
    case 'UPVOTED':
    case 'DOWNVOTED':
      if (!vote) return text
      return text.substring(Number(vote.startWordIndex), Number(vote.endWordIndex)).replace(/(\r\n|\n|\r)/gm, '')
    case 'QUOTED':
      if (!quote) return text
      return text.substring(Number(quote.startWordIndex), Number(quote.endWordIndex)).replace(/(\r\n|\n|\r)/gm, '')
    default:
      return text
  }
}

export default getActivityContent
