import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useStudents, useIndividual } from '../../hooks/useApi'
import PageHeader from '../../components/layout/PageHeader'
import { Spinner, Empty, GradePill, ProgressBar } from '../../components/ui'
import { fmt, grade, gradeColor, levelColor, initials } from '../../lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'

const COLORS = { fail: '#E24B4A', pass: '#BA7517', merit: '#1D9E75', distinction: '#185FA5' }

export default function IndividualPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [stuId, setStuId] = useState(searchParams.get('stu') ?? '')
  const { data: students } = useStudents()
  const { data, isLoading, error } = useIndividual(stuId)

  useEffect(() => { if (stuId) navigate(`/individual?stu=${stuId}`, { replace: true }) }, [stuId])

  const distData = data ? [
    { name: '0–49%', value: data.subjects.filter(s => s.avg < 50).length },
    { name: '50–69%', value: data.subjects.filter(s => s.avg >= 50 && s.avg < 70).length },
    { name: '70–89%', value: data.subjects.filter(s => s.avg >= 70 && s.avg < 90).length },
    { name: '90–100%', value: data.subjects.filter(s => s.avg >= 90).length },
  ] : []

  const trendData = data?.trends.map(t => ({ label: `${t.year} ${t.term}`, avg: parseFloat(t.avg.toFixed(1)) })) ?? []

  return (
    <>
      <PageHeader
        title="Individual Performance"
        meta="Deep-dive into a single student's performance"
        action={
          <div className="flex items-center gap-2">
            <select
              value={stuId}
              onChange={e => setStuId(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white font-sans focus:outline-none focus:border-accent max-w-72"
            >
              <option value="">— Select a student —</option>
              {students?.map(s => <option key={s.stuId} value={s.stuId}>{s.name} ({s.stuId}) — {s.instName}</option>)}
            </select>
            {data && <button onClick={() => window.print()} className="btn-primary text-xs">Export PDF</button>}
          </div>
        }
      />

      <div className="p-5">
        {!stuId && (
          <div className="card flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            <p className="font-medium text-gray-500">No student selected</p>
            <p className="text-sm mt-1">Choose a student from the dropdown above</p>
          </div>
        )}

        {stuId && isLoading && <div className="flex justify-center py-16"><Spinner /></div>}
        {stuId && error && <div className="alert-error">Failed to load student data</div>}

        {data && (
          <div className="space-y-4">
            {/* Profile header */}
            <div className="card flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center text-lg font-bold text-accent font-mono flex-shrink-0">
                {initials(data.profile.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold">{data.profile.name}</h2>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                  <span className="font-mono">{data.profile.stuId}</span>
                  <span>🏫 {data.profile.instName}</span>
                  <span>📚 {data.profile.level}</span>
                  <span>🎓 {data.profile.class}</span>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-3">
              <div className={`stat-card ${data.profile.mean !== null ? (data.profile.mean >= 75 ? 'border-emerald-400 bg-emerald-50' : data.profile.mean >= 50 ? 'border-accent bg-accent-light' : 'border-amber-400 bg-amber-50') : 'border-accent bg-accent-light'}`}>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Mean Score</div>
                <div className="text-2xl font-semibold tabular-nums">{fmt(data.profile.mean)}</div>
                <div className="text-xs text-gray-400 mt-0.5">Grade {grade(data.profile.mean)}</div>
              </div>
              <div className={`stat-card ${data.rank === 1 ? 'border-emerald-400 bg-emerald-50' : data.rank > data.class_size / 2 ? 'border-amber-400 bg-amber-50' : ''}`}>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Class Rank</div>
                <div className="text-2xl font-semibold tabular-nums">{data.class_size ? `${data.rank} / ${data.class_size}` : '—'}</div>
                <div className="text-xs text-gray-400 mt-0.5">{data.profile.class}</div>
              </div>
              <div className="stat-card">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Subjects</div>
                <div className="text-2xl font-semibold tabular-nums">{data.subjects.length || '—'}</div>
                <div className="text-xs text-gray-400 mt-0.5">Distinct subjects</div>
              </div>
              <div className="stat-card">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Terms</div>
                <div className="text-2xl font-semibold tabular-nums">{data.trends.length || '—'}</div>
                <div className="text-xs text-gray-400 mt-0.5">Recorded periods</div>
              </div>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Subject bar */}
              <div className="card">
                <h3 className="text-sm font-semibold mb-3">Subject Performance</h3>
                {data.subjects.length ? (
                  <ResponsiveContainer width="100%" height={Math.max(180, data.subjects.length * 36)}>
                    <BarChart data={data.subjects.map(s => ({ name: s.subject, avg: parseFloat(s.avg.toFixed(1)) }))} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <XAxis type="number" domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [`${v.toFixed(1)}% — Grade ${grade(v)}`, 'Score']} />
                      <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                        {data.subjects.map((s, i) => (
                          <Cell key={i} fill={s.avg >= 90 ? '#185FA5' : s.avg >= 75 ? '#1D9E75' : s.avg >= 60 ? '#7F77DD' : s.avg >= 50 ? '#BA7517' : '#E24B4A'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Empty msg="No results" />}
              </div>

              {/* Distribution donut */}
              <div className="card">
                <h3 className="text-sm font-semibold mb-3">Score Distribution</h3>
                {distData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={distData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                        {distData.map((_, i) => (
                          <Cell key={i} fill={[COLORS.fail, COLORS.pass, COLORS.merit, COLORS.distinction][i]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, name) => [v, name]} />
                      <Legend iconType="square" iconSize={10} formatter={(v) => <span className="text-xs">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <Empty msg="No results" />}
              </div>
            </div>

            {/* Trend line */}
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">Performance Trend</h3>
              {trendData.length ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData} margin={{ left: 8, right: 16 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Score']} />
                    <Line type="monotone" dataKey="avg" stroke={levelColor(data.profile.level)} strokeWidth={2.5} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <Empty msg="Not enough data for trend" />}
            </div>

            {/* Subject averages table */}
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm">All Subjects</div>
              <table className="w-full text-sm">
                <thead><tr>
                  {['Subject','Entries','Average','Grade','vs System Avg'].map(h => <th key={h} className="table-th">{h}</th>)}
                </tr></thead>
                <tbody>
                  {data.subjects.map(s => (
                    <tr key={s.subject} className="hover:bg-gray-50">
                      <td className="table-td font-medium">{s.subject}</td>
                      <td className="table-td text-gray-500">{s.count}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={s.avg} color={levelColor(data.profile.level)} />
                          <span className="font-semibold w-12 text-right">{s.avg.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="table-td"><GradePill value={s.avg} /></td>
                      <td className="table-td">
                        {data.profile.mean !== null && (
                          <span className={s.avg >= data.profile.mean ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
                            {s.avg >= data.profile.mean ? '+' : ''}{(s.avg - data.profile.mean).toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
