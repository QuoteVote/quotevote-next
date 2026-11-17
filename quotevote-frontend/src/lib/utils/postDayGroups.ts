import moment from "moment";

/** "Today", "Yesterday", a weekday within the last week, else "Nov 3, 2026". */
export function dayLabel(created: string, now: Date = new Date()): string {
  const day = moment(created);
  if (!day.isValid()) return "";
  const today = moment(now).startOf("day");
  const diff = today.diff(day.clone().startOf("day"), "days");
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return day.format("dddd");
  return day.format(day.year() === today.year() ? "MMM D" : "MMM D, YYYY");
}

/** Splits posts into runs that share a day label, keeping their order. */
export function groupByDay<T extends { created: string }>(
  posts: T[],
  now: Date = new Date()
): Array<{ label: string; posts: T[] }> {
  const groups: Array<{ label: string; posts: T[] }> = [];
  for (const post of posts) {
    const label = dayLabel(post.created, now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.posts.push(post);
    else groups.push({ label, posts: [post] });
  }
  return groups;
}
