import { useState } from 'react'
import { useLevels, useInstitutionStats, useSubjectStats, useTrends, useDistribution } from '../../hooks/useApi'
import PageHeader from '../../components/layout/PageHeader'
import { Spinner, Empty } from '../../components/ui'
import { fmt, levelColor } from '../../lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie, Legend,
} from 'recharts'

type Tab = 'levels' | 'institutions' | 'subjects' | 'trends'
const TABS: { key: Tab; label: string }[] = [
  { key: 'levels', label: 'By Level' },
  { key: 'institutions', label: 'By Institution' },
  { key: 'subjects', label: 'By Subject' },
  { key: 'trends', label: 'Trends' },
]

const BAND_COLORS = ['#E24B4A', '#BA7517', '#1D9E75', '#185FA5']

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('levels')
  const [instType, setInstType] = useState('all')

  const { data: levels } = useLevels()
  const { data: instStats } = useInstitutionStats(instType !== 'all' ? instType : undefined)
  const { data: subjects } = useSubjectStats()
  const { data: trends } = useTrends()
  const { data: dist } = useDistribution()

  const lvlData = (levels ?? []).map(l => ({ name: l.level, avg: l.avg ? parseFloat(l.avg.toFixed(1)) : 0, students: l.students }))
  const instData = (instStats ?? []).filter(i => i.avg !== null).map(i => ({ name: i.name, avg: parseFloat(Number(i.avg).toFixed(1)), type: i.type }))
  const subjData = (subjects ?? []).map(s => ({ name: s.subject, avg: parseFloat(s.avg.toFixed(1)), count: s.count }))
  const top5 = subjData.slice(0, 5)
  const bot5 = subjData.slice(-5).reverse()

  const distData = dist ? [
    { name: '0–49%', value: dist.fail },
    { name: '50–69%', value: dist.pass },
    { name: '70–89%', value: dist.merit },
    { name: '90–100%', value: dist.distinction },
  ] : []

  // Build trend lines per level
  const termOrder = ['Term 1','Term 2','Term 3','Semester 1','Semester 2']
  const allTerms = [...new Set((trends ?? []).map(t => t.term))].sort((a,b) => termOrder.indexOf(a) - termOrder.indexOf(b))
  const allYears = [...new Set((trends ?? []).map(t => t.year))].sort()
  const trendLineData = allTerms.map(term => {
    const row: Record<string, number | string> = { term }
    ;(['Primary','Secondary','University'] as const).forEach(lv => {
      const r = trends?.find(t => t.term === term && t.level === lv)
      if (r) row[lv] = parseFloat(r.avg.toFixed(1))
    })
    return row
  })
  const yoyData = allYears.map(year => {
    const rows = trends?.filter(t => t.year === year) ?? []
    const total = rows.reduce((a, r) => a + r.avg * r.count, 0)
    const cnt = rows.reduce((a, r) => a + r.count, 0)
    return { year, avg: cnt ? parseFloat((total / cnt).toFixed(1)) : 0 }
  })

  return (
    <>
      <PageHeader title="Analytics" meta="Performance insights & visualisations" />
      <div className="p-5">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 mb-4 gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`tab ${tab === t.key ? 'active' : ''}`}>{t.label}</button>
          ))}
        </div>

        {/* BY LEVEL */}
        {tab === 'levels' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {(['Primary','Secondary','University'] as const).map(lv => {
                const r = levels?.find(l => l.level === lv)
                return <div key={lv} className="stat-card"><div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">{lv} Avg</div><div className="text-2xl font-semibold">{fmt(r?.avg ?? null)}</div><div className="text-xs text-gray-400">{r?.students ?? 0} students</div></div>
              })}
              <div className="stat-card accent"><div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">System Avg</div><div className="text-2xl font-semibold">{fmt(lvlData.reduce((a,l) => a + l.avg, 0) / (lvlData.filter(l => l.avg > 0).length || 1))}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="card">
                <h3 className="text-sm font-semibold mb-3">Average by level</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={lvlData} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <XAxis type="number" domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [v.toFixed(1) + '%', 'Average']} />
                    <Bar dataKey="avg" radius={[0, 5, 5, 0]}>
                      {lvlData.map((l, i) => <Cell key={i} fill={levelColor(l.name)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3 className="text-sm font-semibold mb-3">Score distribution</h3>
                {distData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={distData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                        {distData.map((_, i) => <Cell key={i} fill={BAND_COLORS[i]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconType="square" iconSize={10} formatter={(v) => <span className="text-xs">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <Empty msg="No results yet" />}
              </div>
            </div>
          </div>
        )}

        {/* BY INSTITUTION */}
        {tab === 'institutions' && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Institution rankings</h3>
              <select value={instType} onChange={e => setInstType(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white font-sans">
                <option value="all">All types</option>
                <option>Primary</option><option>Secondary</option><option>University</option>
              </select>
            </div>
            {instData.length ? (
              <ResponsiveContainer width="100%" height={Math.max(240, instData.length * 44)}>
                <BarChart data={instData} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v.toFixed(1) + '%', 'Average']} />
                  <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                    {instData.map((d, i) => <Cell key={i} fill={levelColor(d.type)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty msg="No institution data" />}
          </div>
        )}

        {/* BY SUBJECT */}
        {tab === 'subjects' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="card">
                <h3 className="text-sm font-semibold mb-3">Top 5 subjects</h3>
                {top5.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={top5} layout="vertical" margin={{ left: 8, right: 24 }}>
                      <XAxis type="number" domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [v.toFixed(1) + '%', 'Average']} />
                      <Bar dataKey="avg" fill="#185FA5" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Empty />}
              </div>
              <div className="card">
                <h3 className="text-sm font-semibold mb-3">Bottom 5 subjects</h3>
                {bot5.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={bot5} layout="vertical" margin={{ left: 8, right: 24 }}>
                      <XAxis type="number" domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [v.toFixed(1) + '%', 'Average']} />
                      <Bar dataKey="avg" fill="#E24B4A" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Empty />}
              </div>
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">All subjects ranked</h3>
              {subjData.length ? (
                <ResponsiveContainer width="100%" height={Math.max(200, subjData.length * 38)}>
                  <BarChart data={subjData} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <XAxis type="number" domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number, _n, p) => [v.toFixed(1) + '%', `${p.payload.count} entries`]} />
                    <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                      {subjData.map((s, i) => <Cell key={i} fill={s.avg >= 75 ? '#185FA5' : s.avg >= 60 ? '#1D9E75' : '#BA7517'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </div>
          </div>
        )}

        {/* TRENDS */}
        {tab === 'trends' && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-sm font-semibold mb-1">Performance by term</h3>
              <div className="flex gap-4 text-xs text-gray-500 mb-3">
                {(['Primary','Secondary','University'] as const).map(lv => (
                  <span key={lv} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm inline-block" style={{ background: levelColor(lv) }} />
                    {lv}
                  </span>
                ))}
              </div>
              {trendLineData.length ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendLineData} margin={{ left: 8, right: 16 }}>
                    <XAxis dataKey="term" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number, name) => [`${v.toFixed(1)}%`, String(name)]} />
                    {(['Primary','Secondary','University'] as const).map(lv => (
                      <Line key={lv} type="monotone" dataKey={lv} stroke={levelColor(lv)} strokeWidth={2} dot={{ r: 4 }} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : <Empty msg="No trend data yet" />}
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">Year-on-year average</h3>
              {yoyData.length ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={yoyData} margin={{ left: 8, right: 16 }}>
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [v.toFixed(1) + '%', 'System avg']} />
                    <Line type="monotone" dataKey="avg" stroke="#185FA5" strokeWidth={2.5} dot={{ r: 5 }} fill="#185FA522" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <Empty msg="No year-on-year data yet" />}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
