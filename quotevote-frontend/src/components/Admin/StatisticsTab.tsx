'use client'

import { useQuery } from '@apollo/client/react'
import moment from 'moment'
import { Users, Clock, XCircle, BarChart3 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { GET_USERS } from '@/graphql/queries'
import type { InviteRequest } from '@/types/admin'

interface StatisticsTabProps {
  inviteData: InviteRequest[]
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border p-4">
      <div className={`flex size-10 items-center justify-center rounded-lg ${color}`}>
        <Icon className="size-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export default function StatisticsTab({ inviteData }: StatisticsTabProps) {
  const { data: usersData, loading: usersLoading } = useQuery<{
    users: { _id: string }[]
  }>(GET_USERS, {
    variables: { limit: 1000, offset: 0 },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  })

  const totalActiveUsers =
    usersData?.users && Array.isArray(usersData.users) ? usersData.users.length : 0

  const pendingInvitations = inviteData.filter(
    (u) => parseInt(u.status) === 1
  ).length
  const declinedUsers = inviteData.filter(
    (u) => parseInt(u.status) === 2
  ).length
  const totalInvitations = inviteData.length

  // Build monthly signup data for the chart
  const monthly: Record<string, number> = {}
  inviteData.forEach(({ joined }) => {
    if (!joined) return
    const key = moment(joined).format('YYYY-MM')
    monthly[key] = (monthly[key] || 0) + 1
  })
  const sortedMonths = Object.keys(monthly).sort()
  const maxValue = Math.max(...Object.values(monthly), 1)

  if (usersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">User Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={totalActiveUsers}
            icon={Users}
            color="bg-primary"
          />
          <StatCard
            label="Total Invitations"
            value={totalInvitations}
            icon={BarChart3}
            color="bg-blue-500"
          />
          <StatCard
            label="Pending"
            value={pendingInvitations}
            icon={Clock}
            color="bg-amber-500"
          />
          <StatCard
            label="Declined"
            value={declinedUsers}
            icon={XCircle}
            color="bg-red-500"
          />
        </div>

        {/* Simple bar chart */}
        {sortedMonths.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">Signups Over Time</h3>
            <div className="flex items-end gap-1.5 h-32">
              {sortedMonths.map((month) => {
                const count = monthly[month]
                const height = Math.max((count / maxValue) * 100, 4)
                return (
                  <div
                    key={month}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <span className="text-xs font-medium">{count}</span>
                    <div
                      className="w-full bg-primary/80 rounded-t-sm min-w-[8px] transition-all"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground -rotate-45 origin-top-left whitespace-nowrap">
                      {moment(month, 'YYYY-MM').format('MMM YY')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
