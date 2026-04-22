import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useResults, useCreateResult, useBulkResults, useStudents, useDeleteResult } from '../../hooks/useApi'
import PageHeader from '../../components/layout/PageHeader'
import { Spinner, Empty, Alert, Field } from '../../components/ui'
import { useAuthStore } from '../../store/auth'

interface FormData {
  stuId: string; subject: string; score: string
  scoreType: 'percent' | 'gpa'; term: string; year: string
}

export default function ResultsPage() {
  const [tab, setTab] = useState<'manual' | 'csv' | 'view'>('manual')
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'warn'; text: string } | null>(null)
  const [csvResult, setCsvResult] = useState<{ inserted: number; skipped: number; errors: string[] } | null>(null)

  const { data: students } = useStudents()
  const { data: results, isLoading } = useResults()
  const { mutateAsync: create, isPending } = useCreateResult()
  const { mutateAsync: bulk, isPending: bulkPending } = useBulkResults()
  const { mutateAsync: remove } = useDeleteResult()
  const { admin } = useAuthStore()
  const canEdit = admin?.role === 'ADMIN' || admin?.role === 'SUPER'

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { scoreType: 'percent', term: 'Term 1', year: new Date().getFullYear().toString() }
  })

  const onSubmit = async (data: FormData) => {
    try {
      const r = await create({ ...data, score: parseFloat(data.score) }) as any
      setMsg({ type: 'success', text: `Saved! Normalised: ${parseFloat(r.normalised).toFixed(1)}%` })
      reset({ scoreType: 'percent', term: 'Term 1', year: new Date().getFullYear().toString() })
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error ?? 'Failed to save result' })
    }
  }

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text()
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const records = lines.slice(1).map(line => {
      const vals = line.split(',')
      const rec: Record<string, string> = {}
      headers.forEach((h, i) => rec[h] = (vals[i] ?? '').trim())
      return {
        student_id: rec['student_id'] ?? rec['stu_id'],
        subject: rec['subject'],
        score: parseFloat(rec['score']),
        score_type: (rec['score_type'] || 'percent') as 'percent' | 'gpa',
        term: rec['term'],
        year: rec['year'],
      }
    })
    try {
      const r = await bulk(records)
      setCsvResult(r)
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error ?? 'Upload failed' })
    }
    e.target.value = ''
  }

  return (
    <>
      <PageHeader title="Results" meta="Enter and manage student results" />
      <div className="p-5">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 mb-4 gap-1">
          {(['manual','csv','view'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`tab ${tab === t ? 'active' : ''} capitalize`}>{t === 'csv' ? 'CSV Upload' : t === 'view' ? 'View Results' : 'Manual Entry'}</button>
          ))}
        </div>

        {msg && <div className="mb-3"><Alert type={msg.type} msg={msg.text} /></div>}

        {/* Manual */}
        {tab === 'manual' && canEdit && (
          <div className="card max-w-lg">
            <h3 className="font-semibold text-sm mb-4">Enter result</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Student" error={errors.stuId?.message}>
                  <select className="input" {...register('stuId', { required: 'Required' })}>
                    <option value="">Select student…</option>
                    {students?.map(s => <option key={s.stuId} value={s.stuId}>{s.name} ({s.stuId})</option>)}
                  </select>
                </Field>
                <Field label="Subject / Unit" error={errors.subject?.message}>
                  <input className="input" placeholder="e.g. Mathematics" {...register('subject', { required: 'Required' })} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Score" error={errors.score?.message}>
                  <input className="input" type="number" step="0.01" placeholder="0–100 or 0–4.0" {...register('score', { required: 'Required' })} />
                </Field>
                <Field label="Score type">
                  <select className="input" {...register('scoreType')}>
                    <option value="percent">Percentage (0–100)</option>
                    <option value="gpa">GPA (0–4.0)</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Term / Semester">
                  <select className="input" {...register('term')}>
                    <option>Term 1</option><option>Term 2</option><option>Term 3</option>
                    <option>Semester 1</option><option>Semester 2</option>
                  </select>
                </Field>
                <Field label="Year">
                  <input className="input" {...register('year', { required: 'Required' })} />
                </Field>
              </div>
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? <><Spinner className="mr-1.5" />Saving…</> : 'Save result'}
              </button>
            </form>
          </div>
        )}

        {/* CSV */}
        {tab === 'csv' && (
          <div className="card max-w-lg">
            <h3 className="font-semibold text-sm mb-2">CSV bulk upload</h3>
            <div className="alert-warn mb-3 text-xs">
              Required columns: <strong>student_id, subject, score, score_type, term, year</strong>
            </div>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-8 cursor-pointer hover:border-accent transition-colors">
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              <span className="text-sm text-gray-500">Click to select CSV file</span>
              <span className="text-xs text-gray-400 mt-1">UTF-8 · max 5MB</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleCSV} disabled={bulkPending} />
            </label>
            {bulkPending && <div className="flex items-center gap-2 mt-3 text-sm text-gray-500"><Spinner />Uploading…</div>}
            {csvResult && (
              <div className={`mt-3 ${csvResult.skipped === 0 ? 'alert-success' : 'alert-warn'}`}>
                {csvResult.inserted} inserted, {csvResult.skipped} skipped.
                {csvResult.errors.slice(0, 3).map((e, i) => <div key={i} className="text-xs mt-1">{e}</div>)}
              </div>
            )}
          </div>
        )}

        {/* View */}
        {tab === 'view' && (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr>
                {['Student','Subject','Score','Normalised','Term','Year',''].map(h => <th key={h} className="table-th">{h}</th>)}
              </tr></thead>
              <tbody>
                {isLoading
                  ? <tr><td colSpan={7}><div className="flex justify-center py-8"><Spinner /></div></td></tr>
                  : results?.length
                    ? results.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="table-td font-medium">{r.stuName}</td>
                        <td className="table-td">{r.subject}</td>
                        <td className="table-td">{r.score}{r.scoreType === 'gpa' ? ' GPA' : '%'}</td>
                        <td className="table-td font-semibold">{parseFloat(String(r.normalised)).toFixed(1)}%</td>
                        <td className="table-td text-gray-500">{r.term}</td>
                        <td className="table-td font-mono text-xs text-gray-400">{r.year}</td>
                        <td className="table-td">
                          {canEdit && <button onClick={() => remove(r.id)} className="btn-danger text-xs py-1 px-2">Del</button>}
                        </td>
                      </tr>
                    ))
                    : <tr><td colSpan={7}><Empty msg="No results yet" /></td></tr>
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
