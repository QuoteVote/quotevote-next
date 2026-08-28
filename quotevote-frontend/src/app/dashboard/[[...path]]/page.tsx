import { redirect } from 'next/navigation'

interface DashboardCatchAllProps {
  params: Promise<{ path?: string[] }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function DashboardCatchAll({ params, searchParams }: DashboardCatchAllProps) {
  const { path } = await params
  const sp = searchParams ? await searchParams : {}
  const queryString = new URLSearchParams()
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === 'string') {
      queryString.set(key, value)
    } else if (Array.isArray(value)) {
      value.forEach((v) => queryString.append(key, v))
    }
  }
  const query = queryString.toString()
  const joined = path ? path.join('/') : ''
  // /dashboard/explore -> / (explore was replaced by root)
  const newPath = !joined || joined === 'explore' || joined.startsWith('explore/') ? '/' : `/${joined}`
  redirect(query ? `${newPath}?${query}` : newPath)
}
