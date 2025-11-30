import { GetActivityContentArgs } from "@/types/store"
const getActivityContent = ({ type, post, quote, vote, comment }: GetActivityContentArgs): string => {
  const { text } = post
  switch (type.toUpperCase()) {
    case 'LIKED':
    case 'POSTED':
      return text
    case 'COMMENTED':
      return text.substring(comment.startWordIndex, comment.endWordIndex).replace(/(\r\n|\n|\r)/gm, '')
    case 'UPVOTED':
    case 'DOWNVOTED':
      return text.substring(vote.startWordIndex, vote.endWordIndex).replace(/(\r\n|\n|\r)/gm, '')
    case 'QUOTED':
      return text.substring(quote.startWordIndex, quote.endWordIndex).replace(/(\r\n|\n|\r)/gm, '')
    default:
      return text
  }
}

export default getActivityContent
