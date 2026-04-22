import { useOverview, useLevels, useInstitutionStats } from '../hooks/useApi'
import PageHeader from '../components/layout/PageHeader'
import { StatCard, Spinner, Empty, ProgressBar } from '../components/ui'
import { fmt, levelColor, badgeClass, timeAgo } from '../lib/utils'

export default function OverviewPage() {
  const { data: overview, isLoading } = useOverview()
  const { data: levels } = useLevels()
  const { data: instStats } = useInstitutionStats()

  if (isLoading) return (
    <><PageHeader title="Overview" meta="System summary" />
    <div className="flex items-center justify-center h-64"><Spinner /></div></>
  )

  const top5 = (instStats ?? []).filter(i => i.avg !== null).slice(0, 5)

  return (
    <>
      <PageHeader title="Overview" meta="System summary — all education levels" />
      <div className="p-5 space-y-4">

        {/* Stat grid */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Institutions" value={overview?.institutions ?? 0} sub="Registered" />
          <StatCard label="Students" value={overview?.students ?? 0} sub="All levels" />
          <StatCard label="Results" value={overview?.results ?? 0} sub="Entries" />
          <StatCard label="System Avg" value={fmt(overview?.system_avg ?? null)} sub="Normalised 0–100" accent />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Performance by level */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Performance by level</h3>
            {levels?.length ? levels.map(l => (
              <div key={l.level} className="flex items-center py-1.5">
                <span className="text-xs text-gray-500 w-22 flex-shrink-0">{l.level}</span>
                <ProgressBar value={l.avg ?? 0} color={levelColor(l.level)} />
                <span className="text-xs font-semibold w-10 text-right">{fmt(l.avg)}</span>
                <span className="text-xs text-gray-400 ml-2 w-16">{l.students} students</span>
              </div>
            )) : <Empty msg="No data yet" />}
          </div>

          {/* Top institutions */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Top institutions</h3>
            {top5.length ? top5.map((inst, i) => (
              <div key={inst.instId} className="flex items-center py-1.5">
                <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                <span className="text-xs flex-1 ml-2 font-medium">{inst.name}</span>
                <span className={`badge ${badgeClass(inst.type)} text-[10px]`}>{inst.type}</span>
                <span className="text-xs font-semibold ml-2">{fmt(inst.avg)}</span>
              </div>
            )) : <Empty msg="No institution data yet" />}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-3">Recent activity</h3>
          {overview?.activity.length ? overview.activity.map(a => (
            <div key={a.id} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
              <span className="text-sm">{a.message}</span>
              <span className="text-xs text-gray-400 ml-4 flex-shrink-0 font-mono">{timeAgo(a.createdAt)}</span>
            </div>
          )) : <Empty msg="Activity will appear here" />}
        </div>

      </div>
    </>
  )
}
