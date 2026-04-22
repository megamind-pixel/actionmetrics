import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useInstitutions, useCreateInstitution, useDeleteInstitution } from '../../hooks/useApi'
import PageHeader from '../../components/layout/PageHeader'
import { Spinner, Empty, Alert, Field } from '../../components/ui'
import { fmt, badgeClass } from '../../lib/utils'
import { useAuthStore } from '../../store/auth'

interface FormData { name: string; type: string; county: string }

export default function InstitutionsPage() {
  const [tab, setTab] = useState<'list' | 'add'>('list')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { data: institutions, isLoading } = useInstitutions()
  const { mutateAsync: create, isPending } = useCreateInstitution()
  const { mutateAsync: remove } = useDeleteInstitution()
  const { admin } = useAuthStore()
  const canEdit = admin?.role === 'ADMIN' || admin?.role === 'SUPER'

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    try {
      const inst = await create({ name: data.name, type: data.type, county: data.county || undefined })
      setMsg({ type: 'success', text: `${inst.name} registered — ${inst.instId}` })
      reset()
      setTab('list')
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error ?? 'Failed to create institution' })
    }
  }

  const handleDelete = async (instId: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will also delete all linked students and results.`)) return
    try { await remove(instId) } catch (e: any) { alert(e.response?.data?.error) }
  }

  return (
    <>
      <PageHeader
        title="Institutions"
        meta="Register and manage schools & universities"
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
                {['ID','Name','Type','County','Students','Avg Score',''].map(h => <th key={h} className="table-th">{h}</th>)}
              </tr></thead>
              <tbody>
                {isLoading
                  ? <tr><td colSpan={7}><div className="flex justify-center py-8"><Spinner /></div></td></tr>
                  : institutions?.length
                    ? institutions.map(i => (
                      <tr key={i.instId} className="hover:bg-gray-50 transition-colors">
                        <td className="table-td font-mono text-xs text-gray-400">{i.instId}</td>
                        <td className="table-td font-medium">{i.name}</td>
                        <td className="table-td"><span className={`badge ${badgeClass(i.type)}`}>{i.type}</span></td>
                        <td className="table-td text-gray-500">{i.county ?? '—'}</td>
                        <td className="table-td">{i.students}</td>
                        <td className="table-td font-semibold">{fmt(i.avg)}</td>
                        <td className="table-td">
                          {admin?.role === 'SUPER' && (
                            <button onClick={() => handleDelete(i.instId, i.name)} className="btn-danger text-xs py-1 px-2">Delete</button>
                          )}
                        </td>
                      </tr>
                    ))
                    : <tr><td colSpan={7}><Empty msg="No institutions yet" /></td></tr>
                }
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card max-w-lg">
            <h3 className="font-semibold text-sm mb-4">Register institution</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Institution name" error={errors.name?.message}>
                  <input className="input" placeholder="e.g. Starehe Boys Centre" {...register('name', { required: 'Required' })} />
                </Field>
                <Field label="Type" error={errors.type?.message}>
                  <select className="input" {...register('type', { required: 'Required' })}>
                    <option value="">Select…</option>
                    <option>Primary</option><option>Secondary</option><option>University</option>
                  </select>
                </Field>
              </div>
              <Field label="County">
                <input className="input" placeholder="e.g. Nairobi" {...register('county')} />
              </Field>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={isPending} className="btn-primary">
                  {isPending ? <><Spinner className="mr-1.5" />Saving…</> : 'Register'}
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
