import { useState } from 'react'
import { useOverview, useLevels, useInstitutionStats, useStudents } from '../../hooks/useApi'
import PageHeader from '../../components/layout/PageHeader'
import { Spinner } from '../../components/ui'
import { fmt, grade, badgeClass } from '../../lib/utils'

type ReportType = 'national' | 'institution' | 'student'

export default function ReportsPage() {
  const [active, setActive] = useState<ReportType | null>(null)
  const [loading, setLoading] = useState(false)

  const { data: overview } = useOverview()
  const { data: levels } = useLevels()
  const { data: instStats } = useInstitutionStats()
  const { data: students } = useStudents()

  const printReport = () => window.print()

  const cards = [
    { type: 'national' as ReportType, emoji: '🇰🇪', title: 'National Summary', sub: 'Full system overview' },
    { type: 'institution' as ReportType, emoji: '🏫', title: 'Institution Report', sub: 'School & university summary' },
    { type: 'student' as ReportType, emoji: '🎓', title: 'Student Report Cards', sub: 'Individual performance' },
  ]

  const date = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <PageHeader
        title="Reports"
        meta="Generate & export reports"
        action={active && <button onClick={printReport} className="btn-primary">🖨 Export / Print PDF</button>}
      />
      <div className="p-5 space-y-4">
        {/* Report type picker */}
        <div className="grid grid-cols-3 gap-3">
          {cards.map(c => (
            <button
              key={c.type}
              onClick={() => setActive(c.type)}
              className={`card text-left cursor-pointer hover:border-accent transition-colors ${active === c.type ? 'border-accent bg-accent-light' : ''}`}
            >
              <div className="text-2xl mb-2">{c.emoji}</div>
              <div className="font-semibold text-sm">{c.title}</div>
              <div className="text-xs text-gray-400 mt-1">{c.sub}</div>
            </button>
          ))}
        </div>

        {/* Report output */}
        {active === 'national' && (
          <div className="card space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-base">National Summary Report</h2>
                <p className="text-xs text-gray-400 mt-0.5">Generated {date} · ActionMetrics Kenya</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="stat-card"><div className="sl text-xs text-gray-500 uppercase tracking-wide mb-1">Institutions</div><div className="text-2xl font-semibold">{overview?.institutions ?? 0}</div></div>
              <div className="stat-card"><div className="sl text-xs text-gray-500 uppercase tracking-wide mb-1">Students</div><div className="text-2xl font-semibold">{overview?.students ?? 0}</div></div>
              <div className="stat-card"><div className="sl text-xs text-gray-500 uppercase tracking-wide mb-1">Results</div><div className="text-2xl font-semibold">{overview?.results ?? 0}</div></div>
              <div className="stat-card border-accent bg-accent-light"><div className="sl text-xs text-accent uppercase tracking-wide mb-1">System Avg</div><div className="text-2xl font-semibold text-accent">{fmt(overview?.system_avg ?? null)}</div></div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2">Level Breakdown</h3>
              {levels?.map(l => l.avg !== null && (
                <div key={l.level} className="flex items-center py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-500 w-24">{l.level}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full mx-3">
                    <div className="h-full rounded-full" style={{ width: `${l.avg}%`, background: l.level === 'Primary' ? '#185FA5' : l.level === 'Secondary' ? '#1D9E75' : '#7F77DD' }} />
                  </div>
                  <span className="text-xs font-semibold w-12 text-right">{fmt(l.avg)}</span>
                  <span className="text-xs text-gray-400 ml-3">{l.students} students</span>
                </div>
              ))}
            </div>
            {instStats && instStats.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Institution Results</h3>
                <table className="w-full text-sm">
                  <thead><tr>
                    {['Institution','Type','County','Students','Avg Score'].map(h => <th key={h} className="table-th">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {instStats.map(i => (
                      <tr key={i.instId} className="hover:bg-gray-50">
                        <td className="table-td font-medium">{i.name}</td>
                        <td className="table-td"><span className={`badge ${badgeClass(i.type)}`}>{i.type}</span></td>
                        <td className="table-td text-gray-500">{i.county ?? '—'}</td>
                        <td className="table-td">{i.students}</td>
                        <td className="table-td font-semibold">{fmt(i.avg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {active === 'institution' && (
          <div className="card">
            <div className="mb-3">
              <h2 className="font-semibold text-base">Institution Performance Report</h2>
              <p className="text-xs text-gray-400 mt-0.5">Generated {date}</p>
            </div>
            <table className="w-full text-sm">
              <thead><tr>
                {['Name','Type','County','Students','Avg Score'].map(h => <th key={h} className="table-th">{h}</th>)}
              </tr></thead>
              <tbody>
                {instStats?.length
                  ? instStats.map(i => (
                    <tr key={i.instId} className="hover:bg-gray-50">
                      <td className="table-td font-medium">{i.name}</td>
                      <td className="table-td"><span className={`badge ${badgeClass(i.type)}`}>{i.type}</span></td>
                      <td className="table-td text-gray-500">{i.county ?? '—'}</td>
                      <td className="table-td">{i.students}</td>
                      <td className="table-td font-semibold">{fmt(i.avg)}</td>
                    </tr>
                  ))
                  : <tr><td colSpan={5} className="py-8 text-center text-gray-400 text-sm">No institutions registered</td></tr>
                }
              </tbody>
            </table>
          </div>
        )}

        {active === 'student' && (
          <div className="card">
            <div className="mb-3">
              <h2 className="font-semibold text-base">Student Report Cards</h2>
              <p className="text-xs text-gray-400 mt-0.5">Generated {date}</p>
            </div>
            <table className="w-full text-sm">
              <thead><tr>
                {['ID','Name','Institution','Level','Class','Mean Score','Grade'].map(h => <th key={h} className="table-th">{h}</th>)}
              </tr></thead>
              <tbody>
                {students?.length
                  ? students.map(s => (
                    <tr key={s.stuId} className="hover:bg-gray-50">
                      <td className="table-td font-mono text-xs text-gray-400">{s.stuId}</td>
                      <td className="table-td font-medium">{s.name}</td>
                      <td className="table-td text-gray-500 text-xs">{s.instName}</td>
                      <td className="table-td"><span className={`badge ${badgeClass(s.level)}`}>{s.level}</span></td>
                      <td className="table-td">{s.class}</td>
                      <td className="table-td font-semibold">{fmt(s.mean)}</td>
                      <td className="table-td">
                        {s.mean !== null && <span className={`badge ${s.mean >= 75 ? 'bg-emerald-100 text-emerald-800' : s.mean >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>{grade(s.mean)}</span>}
                      </td>
                    </tr>
                  ))
                  : <tr><td colSpan={7} className="py-8 text-center text-gray-400 text-sm">No students registered</td></tr>
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
