'use client'

import { useQuery } from '@apollo/client/react'
import moment from 'moment'
import { Users, Clock, XCircle, BarChart3, TrendingUp } from 'lucide-react'
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
  gradient,
  iconBg,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  iconBg: string
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-border/60 p-5 ${gradient}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">{value.toLocaleString()}</p>
        </div>
        <div className={`size-10 rounded-xl flex items-center justify-center ${iconBg} shadow-sm`}>
          <Icon className="size-5 text-white" />
        </div>
      </div>
      <div className="absolute bottom-0 right-0 size-20 rounded-full opacity-5 -mb-6 -mr-6 bg-foreground" />
    </div>
  )
}

const CHART_H = 160 // px — bar area height

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
  const pendingInvitations = inviteData.filter((u) => parseInt(u.status) === 1).length
  const declinedUsers    = inviteData.filter((u) => parseInt(u.status) === 2).length
  const acceptedUsers    = inviteData.filter((u) => parseInt(u.status) === 4).length
  const totalInvitations = inviteData.length

  // Build monthly buckets
  const monthly: Record<string, number> = {}
  inviteData.forEach(({ joined }) => {
    if (!joined) return
    const key = moment(joined).format('YYYY-MM')
    monthly[key] = (monthly[key] || 0) + 1
  })
  const sortedMonths = Object.keys(monthly).sort().slice(-12)
  const maxValue = Math.max(...sortedMonths.map((m) => monthly[m]), 1)
  const totalSignups = sortedMonths.reduce((s, m) => s + monthly[m], 0)

  // Y-axis tick values: max, half, 0
  const yTicks = [maxValue, Math.round(maxValue / 2), 0]

  if (usersLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[260px] rounded-xl" />
      </div>
    )
  }

  const acceptanceRate = totalInvitations > 0
    ? Math.round((acceptedUsers / totalInvitations) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={totalActiveUsers}
          icon={Users}
          gradient="bg-gradient-to-br from-[#52b274]/5 to-[#52b274]/10"
          iconBg="bg-[#52b274]"
        />
        <StatCard
          label="Total Invitations"
          value={totalInvitations}
          icon={BarChart3}
          gradient="bg-gradient-to-br from-blue-500/5 to-blue-500/10"
          iconBg="bg-blue-500"
        />
        <StatCard
          label="Pending"
          value={pendingInvitations}
          icon={Clock}
          gradient="bg-gradient-to-br from-amber-500/5 to-amber-500/10"
          iconBg="bg-amber-500"
        />
        <StatCard
          label="Declined"
          value={declinedUsers}
          icon={XCircle}
          gradient="bg-gradient-to-br from-red-500/5 to-red-500/10"
          iconBg="bg-red-500"
        />
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Acceptance rate */}
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="size-4 text-[#52b274]" />
            <p className="text-sm font-semibold">Acceptance Rate</p>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold tabular-nums">{acceptanceRate}%</span>
            <span className="text-sm text-muted-foreground mb-1">of invitations accepted</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-[#52b274] transition-all"
              style={{ width: `${acceptanceRate}%` }}
            />
          </div>
        </div>

        {/* Status breakdown */}
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <p className="text-sm font-semibold mb-3">Invite Breakdown</p>
          <div className="space-y-2.5">
            {[
              { label: 'Accepted', count: acceptedUsers,    color: 'bg-[#52b274]' },
              { label: 'Pending',  count: pendingInvitations, color: 'bg-amber-500' },
              { label: 'Declined', count: declinedUsers,    color: 'bg-red-500' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`size-2.5 rounded-full shrink-0 ${color}`} />
                <span className="text-sm text-muted-foreground flex-1">{label}</span>
                <span className="text-sm font-semibold tabular-nums">{count}</span>
                <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                  {totalInvitations > 0 ? Math.round((count / totalInvitations) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      {sortedMonths.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-[#52b274]" />
              <p className="text-sm font-semibold">Monthly Signups</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-lg font-bold tabular-nums">{totalSignups.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground leading-none">
                  last {sortedMonths.length} month{sortedMonths.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {/* Y-axis — matched exactly to bar area height */}
            <div className="relative w-6 shrink-0" style={{ height: CHART_H }}>
              {yTicks.map((tick, i) => (
                <span
                  key={i}
                  className="absolute right-0 text-[10px] tabular-nums text-muted-foreground/70 leading-none"
                  style={{
                    top:       i === 0 ? 0        : i === 1 ? '50%' : undefined,
                    bottom:    i === 2 ? 0        : undefined,
                    transform: i === 1 ? 'translateY(-50%)' : undefined,
                  }}
                >
                  {tick}
                </span>
              ))}
            </div>

            {/* Chart */}
            <div className="flex-1 flex flex-col">
              {/* Bar area — explicit px height so child height-% resolves correctly */}
              <div className="relative" style={{ height: CHART_H }}>
                {/* Gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="w-full border-t border-dashed border-border/30" />
                  <div className="w-full border-t border-dashed border-border/30" />
                  <div className="w-full border-t border-border/50" />
                </div>

                {/* Bars */}
                <div className="absolute inset-0 flex items-end gap-1">
                  {sortedMonths.map((month) => {
                    const count = monthly[month]
                    const heightPct = Math.max((count / maxValue) * 100, 2)

                    return (
                      <div key={month} className="group relative flex-1 h-full flex items-end">
                        {/* Tooltip above bar */}
                        <div
                          className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ bottom: `calc(${heightPct}% + 8px)` }}
                        >
                          <div className="relative bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                            {count}
                            <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-foreground" />
                          </div>
                        </div>

                        {/* Bar — gradient fill, brightens on hover */}
                        <div
                          className="w-full rounded-t-sm cursor-default"
                          style={{
                            height: `${heightPct}%`,
                            background: 'linear-gradient(to bottom, #52b274, #52b27455)',
                            transition: 'filter 0.15s ease',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1.15)' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1)' }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* X-axis labels */}
              <div className="flex gap-1 mt-2">
                {sortedMonths.map((month) => (
                  <div key={month} className="flex-1 flex flex-col items-center">
                    <span className="text-[10px] font-medium text-muted-foreground leading-tight">
                      {moment(month, 'YYYY-MM').format('MMM')}
                    </span>
                    <span className="text-[9px] text-muted-foreground/40 leading-tight">
                      {moment(month, 'YYYY-MM').format("'YY")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
