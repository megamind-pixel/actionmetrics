import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useStudents, useCreateStudent, useDeleteStudent, useInstitutions } from '../../hooks/useApi'
import PageHeader from '../../components/layout/PageHeader'
import { Spinner, Empty, Alert, Field } from '../../components/ui'
import { fmt, badgeClass, gradeColor, grade } from '../../lib/utils'
import { useAuthStore } from '../../store/auth'

interface FormData {
  name: string
  instId: string
  level: string
  class: string
  programme: string
  newInstName: string
  newInstType: string
  newInstCounty: string
}

const CLASS_OPTS: Record<string, string[]> = {
  Primary: ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9'],
  Secondary: ['Form 1','Form 2','Form 3','Form 4'],
  University: ['Year 1','Year 2','Year 3','Year 4'],
}

export default function StudentsPage() {
  const [tab, setTab] = useState<'list' | 'add'>('list')
  const [newInst, setNewInst] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const navigate = useNavigate()

  const { data: students, isLoading } = useStudents()
  const { data: institutions } = useInstitutions()
  const { mutateAsync: create, isPending } = useCreateStudent()
  const { mutateAsync: remove } = useDeleteStudent()
  const { admin } = useAuthStore()
  const canEdit = admin?.role === 'ADMIN' || admin?.role === 'SUPER'

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>()
  const selectedLevel = watch('level')

  const onSubmit = async (data: FormData) => {
    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        level: data.level,
        class: data.class,
        programme: data.programme || undefined,
      }
      if (newInst) {
        payload.newInstitution = { name: data.newInstName, type: data.newInstType, county: data.newInstCounty || undefined }
      } else {
        payload.instId = data.instId
      }
      const stu = await create(payload)
      setMsg({ type: 'success', text: `${(stu as any).name} registered — ${(stu as any).stuId}` })
      reset()
      setNewInst(false)
      setTab('list')
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error ?? 'Failed to create student' })
    }
  }

  const handleDelete = async (stuId: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try { await remove(stuId) } catch (e: any) { alert(e.response?.data?.error) }
  }

  return (
    <>
      <PageHeader
        title="Students"
        meta="Register and manage students"
        action={canEdit && <button onClick={() => setTab(tab === 'add' ? 'list' : 'add')} className="btn-primary">
          {tab === 'add' ? '← Back' : '+ Register new'}
        </button>}
      />
      <div className="p-5">
        {msg && <div className="mb-3"><Alert type={msg.type} msg={msg.text} /></div>}

        {tab === 'list' ? (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr>
                {['ID','Name','Institution','Level','Class','Mean','Grade',''].map(h => <th key={h} className="table-th">{h}</th>)}
              </tr></thead>
              <tbody>
                {isLoading
                  ? <tr><td colSpan={8}><div className="flex justify-center py-8"><Spinner /></div></td></tr>
                  : students?.length
                    ? students.map(s => (
                      <tr key={s.stuId} className="hover:bg-gray-50 transition-colors">
                        <td className="table-td font-mono text-xs text-gray-400">{s.stuId}</td>
                        <td className="table-td font-medium">{s.name}</td>
                        <td className="table-td text-gray-500 text-xs">{s.instName}</td>
                        <td className="table-td"><span className={`badge ${badgeClass(s.level)}`}>{s.level}</span></td>
                        <td className="table-td text-gray-600">{s.class}</td>
                        <td className="table-td font-semibold">{fmt(s.mean)}</td>
                        <td className="table-td">
                          {s.mean !== null && <span className={`badge ${gradeColor(s.mean)}`}>{grade(s.mean)}</span>}
                        </td>
                        <td className="table-td">
                          <div className="flex gap-1.5">
                            <button onClick={() => navigate(`/individual?stu=${s.stuId}`)} className="btn text-xs py-1 px-2">View</button>
                            {canEdit && <button onClick={() => handleDelete(s.stuId, s.name)} className="btn-danger text-xs py-1 px-2">Del</button>}
                          </div>
                        </td>
                      </tr>
                    ))
                    : <tr><td colSpan={8}><Empty msg="No students yet" /></td></tr>
                }
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card max-w-lg">
            <h3 className="font-semibold text-sm mb-4">Register student</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <Field label="Full name" error={errors.name?.message}>
                <input className="input" placeholder="e.g. Amina Wanjiku" {...register('name', { required: 'Required' })} />
              </Field>

              {/* Institution */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Institution</label>
                  <button type="button" onClick={() => setNewInst(!newInst)}
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${newInst ? 'bg-red-50 border-red-200 text-red-600' : 'bg-accent-light border-accent text-accent'}`}>
                    {newInst ? '✕ Cancel' : '+ New'}
                  </button>
                </div>
                {newInst ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-accent mb-1">New institution — created automatically</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Name"><input className="input" placeholder="e.g. Starehe Boys" {...register('newInstName', { required: newInst })} /></Field>
                      <Field label="Type">
                        <select className="input" {...register('newInstType', { required: newInst })}>
                          <option value="">Select…</option>
                          <option>Primary</option><option>Secondary</option><option>University</option>
                        </select>
                      </Field>
                    </div>
                    <Field label="County"><input className="input" placeholder="e.g. Nairobi" {...register('newInstCounty')} /></Field>
                  </div>
                ) : (
                  <select className="input" {...register('instId', { required: !newInst ? 'Required' : false })}>
                    <option value="">Select existing…</option>
                    {institutions?.map(i => <option key={i.instId} value={i.instId}>{i.name}</option>)}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Level" error={errors.level?.message}>
                  <select className="input" {...register('level', { required: 'Required' })}>
                    <option value="">Select…</option>
                    <option>Primary</option><option>Secondary</option><option>University</option>
                  </select>
                </Field>
                <Field label={selectedLevel === 'Primary' ? 'Grade' : selectedLevel === 'Secondary' ? 'Form' : 'Year'} error={errors.class?.message}>
                  <select className="input" {...register('class', { required: 'Required' })}>
                    <option value="">Select level first…</option>
                    {(CLASS_OPTS[selectedLevel] ?? []).map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Programme (university only)">
                <input className="input" placeholder="e.g. Bachelor of Education" {...register('programme')} />
              </Field>

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={isPending} className="btn-primary">
                  {isPending ? <><Spinner className="mr-1.5" />Saving…</> : 'Register student'}
                </button>
                <button type="button" onClick={() => setTab('list')} className="btn">Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
