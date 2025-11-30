import type { CSSProperties, ReactNode } from 'react'
import {
  range, get, isEqual, isEmpty, size, reduce,
} from 'lodash'
import { VoteStyle, Vote, VotePoint, Span, ReduceAccumulator } from '@/types/store'

const getTextSpan = (text: string, prevSpan: ReactNode = null, style: CSSProperties | null = null) => (
  <>
    {prevSpan}
    <span style={style || undefined}>{text}</span>
  </>
)

const getSpanBgColor = (upvotes: number, downvotes: number): VoteStyle => {
  const isEqualVotes = upvotes === downvotes
  const greenBg = upvotes > downvotes
  const voteThreshold = 100 // equal or above threshold will be max darkness of either green (upvotes)/ red(downvotes)
  let opacity = greenBg ? upvotes / voteThreshold : downvotes / voteThreshold
  opacity = opacity > 1 ? 1 : opacity // max opacity is 1
  opacity = opacity < 0.1 ? 0.1 : opacity // set min opacity to 0.1
  if (isEqualVotes) { // gradient bgcolor
    return {
      backgroundImage: `linear-gradient(rgba(0,255,0,${opacity}), rgba(255,0,0,${opacity}))`,
    }
  }
  return {
    backgroundColor: greenBg ? `rgba(0,255,0,${opacity})` : `rgba(255,0,0,${opacity})`,
  }
}


const getTopPostsVoteHighlights = (
  votes: Vote[],
  postTextToChange: ReactNode,
  text: string,
): ReactNode => {
  let indexesAndTheirPoints: Record<number, VotePoint> = {}
  let postText = postTextToChange
  votes.forEach((vote) => {
    const numbersInRange = range(vote.startWordIndex, vote.endWordIndex + 1)
    numbersInRange.forEach((num) => {
      let newIndexAndItsPoints: VotePoint = {
        up: 0,
        down: 0,
        total: 0,
        range: `${vote.startWordIndex} - ${vote.endWordIndex}`,
        start: vote.startWordIndex,
        end: vote.endWordIndex,
      }
      const existingIndex = get(indexesAndTheirPoints, num, false) as VotePoint | false
      if (existingIndex) {
        newIndexAndItsPoints = {
          ...existingIndex,
          [vote.type]: existingIndex[vote.type] + 1,
          total: existingIndex.total + 1,
        }
      } else {
        newIndexAndItsPoints = {
          ...newIndexAndItsPoints,
          [vote.type]: newIndexAndItsPoints[vote.type] + 1,
          total: newIndexAndItsPoints.total + 1,
        }
      }
      indexesAndTheirPoints = {
        ...indexesAndTheirPoints,
        [num]: newIndexAndItsPoints,
      }
    })
  })
  let spanNumber = -1
  const spans: Span[] = []
  reduce(
    indexesAndTheirPoints,
    (result: ReduceAccumulator, value: VotePoint, key: string) => {
      const existingSpan = spans[spanNumber]
      if (!isEqual(value, result.prevVal)) {
        if (!existingSpan) {
          spans.push({ startIndex: Number(key), spanBg: getSpanBgColor(value.up, value.down), value })
        }
        if (existingSpan) {
          existingSpan.endIndex = Number(result.prevKey)
          existingSpan.text = text.slice(existingSpan.startIndex, existingSpan.endIndex)
          spans.push({ startIndex: Number(key), spanBg: getSpanBgColor(value.up, value.down), value })
        }
        spanNumber += 1
      }
      if (existingSpan && Number(value.end) === Number(key)) {
        existingSpan.endIndex = Number(key)
        existingSpan.text = text.slice(existingSpan.startIndex, existingSpan.endIndex)
      }
      result = {
        prevVal: value,
        prevKey: key,
      }
      return result
    },
    { prevVal: {}, prevKey: 0 } as ReduceAccumulator,
  )

  let startingIndex = 0
  const postLastIndex = size(text)
  const spansLastIndex = size(spans) - 1
  if (!isEmpty(spans)) {
    spans.forEach((span, index) => {
      const noHighlightText = text.slice(startingIndex, span.startIndex)
      const highlightedText = text.slice(span.startIndex, span.endIndex)
      if (index === 0) {
        if (Number(span.startIndex) === 0) {
          postText = getTextSpan(highlightedText, null, span.spanBg)
        } else {
          postText = getTextSpan(noHighlightText)
          postText = getTextSpan(highlightedText, postText, span.spanBg)
        }
      } else {
        postText = getTextSpan(noHighlightText, postText)
        postText = getTextSpan(highlightedText, postText, span.spanBg)
        if (spansLastIndex === index && span.endIndex !== postLastIndex) {
          const lastText = text.slice(span.endIndex, postLastIndex)
          postText = getTextSpan(lastText, postText)
        }
      }
      startingIndex = span.endIndex!
    })
  }

  return postText
}

export default getTopPostsVoteHighlights
