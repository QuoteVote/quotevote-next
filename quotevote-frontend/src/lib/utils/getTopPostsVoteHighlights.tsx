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
    const startIdx = Number(vote.startWordIndex)
    const endIdx = Number(vote.endWordIndex)
    const numbersInRange = range(startIdx, endIdx + 1)
    numbersInRange.forEach((num) => {
      let newIndexAndItsPoints: VotePoint = {
        up: 0,
        down: 0,
        total: 0,
        range: `${startIdx} - ${endIdx}`,
        start: startIdx,
        end: endIdx,
      }
      const existingIndex = get(indexesAndTheirPoints, num, false) as VotePoint | false
      const voteType = String(vote.type || 'up')
      if (existingIndex) {
        const existingUp = Number(existingIndex.up || 0)
        const existingDown = Number(existingIndex.down || 0)
        const existingTotal = Number(existingIndex.total || 0)
        newIndexAndItsPoints = {
          ...existingIndex,
          [voteType]: (voteType === 'up' ? existingUp : existingDown) + 1,
          total: existingTotal + 1,
        }
      } else {
        const newUp = voteType === 'up' ? 1 : 0
        const newDown = voteType === 'down' ? 1 : 0
        newIndexAndItsPoints = {
          ...newIndexAndItsPoints,
          up: newUp,
          down: newDown,
          total: 1,
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
        const upValue = Number(value.up || 0)
        const downValue = Number(value.down || 0)
        const newSpan: Span = { 
          startIndex: Number(key), 
          endIndex: Number(key),
          spanBg: getSpanBgColor(upValue, downValue), 
          value 
        }
        if (!existingSpan) {
          spans.push(newSpan)
        }
        if (existingSpan) {
          existingSpan.endIndex = Number(result.prevKey)
          existingSpan.text = text.slice(Number(existingSpan.startIndex), Number(existingSpan.endIndex))
          spans.push(newSpan)
        }
        spanNumber += 1
      }
      if (existingSpan && Number(value.end) === Number(key)) {
        existingSpan.endIndex = Number(key)
        existingSpan.text = text.slice(Number(existingSpan.startIndex), Number(existingSpan.endIndex))
      }
      result.prevVal = value
      result.prevKey = key
      return result
    },
    { prevVal: undefined, prevKey: '0' } as ReduceAccumulator,
  )

  let startingIndex = 0
  const postLastIndex = size(text)
  const spansLastIndex = size(spans) - 1
  if (!isEmpty(spans)) {
    spans.forEach((span, index) => {
      const spanStart = Number(span.startIndex)
      const spanEnd = Number(span.endIndex)
      const noHighlightText = text.slice(startingIndex, spanStart)
      const highlightedText = text.slice(spanStart, spanEnd)
      if (index === 0) {
        if (spanStart === 0) {
          postText = getTextSpan(highlightedText, null, span.spanBg || null)
        } else {
          postText = getTextSpan(noHighlightText)
          postText = getTextSpan(highlightedText, postText, span.spanBg || null)
        }
      } else {
        postText = getTextSpan(noHighlightText, postText)
        postText = getTextSpan(highlightedText, postText, span.spanBg || null)
        if (spansLastIndex === index && spanEnd !== postLastIndex) {
          const lastText = text.slice(spanEnd, postLastIndex)
          postText = getTextSpan(lastText, postText)
        }
      }
      startingIndex = spanEnd
    })
  }

  return postText
}

export default getTopPostsVoteHighlights
