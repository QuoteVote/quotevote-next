import moment from 'moment'

export const parseCommentDate = (rawDate: Date): string => {
  const now = moment(new Date()) // todays date
  const end = moment(rawDate) // another date
  const duration = moment.duration(now.diff(end))
  const days = duration.asDays()
  let parseDated
  if (days > 7) { // more than 1 week
    parseDated = moment(rawDate).format('LL')
  } else {
    parseDated = moment(rawDate).subtract(days, 'days').calendar()
  }
  return parseDated
}
