import { redirect } from 'next/navigation'

interface ExplorePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = searchParams ? await searchParams : {}
  const queryString = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      queryString.set(key, value)
    } else if (Array.isArray(value)) {
      value.forEach((v) => queryString.append(key, v))
    }
  }
  const query = queryString.toString()
  redirect(query ? `/?${query}` : '/')
}
