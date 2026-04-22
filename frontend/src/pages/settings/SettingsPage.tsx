import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAdmins, useRegisterAdmin, useDeleteAdmin } from '../../hooks/useApi'
import { useAuthStore } from '../../store/auth'
import PageHeader from '../../components/layout/PageHeader'
import { Spinner, Empty, Alert, Field } from '../../components/ui'

interface FormData { name: string; email: string; password: string; role: string }

export default function SettingsPage() {
  const { admin } = useAuthStore()
  const isSuper = admin?.role === 'SUPER'
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: admins, isLoading } = useAdmins()
  const { mutateAsync: create, isPending } = useRegisterAdmin()
  const { mutateAsync: remove } = useDeleteAdmin()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ defaultValues: { role: 'VIEWER' } })

  const onSubmit = async (data: FormData) => {
    try {
      await create(data)
      setMsg({ type: 'success', text: `Admin "${data.name}" created successfully.` })
      reset()
      setShowForm(false)
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error ?? 'Failed to create admin' })
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove admin "${name}"?`)) return
    try { await remove(id) } catch (e: any) { alert(e.response?.data?.error) }
  }

  const roleBadge = (role: string) => {
    const cls = role === 'SUPER' ? 'bg-purple-100 text-purple-800' : role === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
    return <span className={`badge ${cls}`}>{role}</span>
  }

  return (
    <>
      <PageHeader
        title="Settings"
        meta="Manage admin accounts and permissions"
        action={isSuper && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? '← Cancel' : '+ Add admin'}
          </button>
        )}
      />
      <div className="p-5 space-y-4">
        {msg && <Alert type={msg.type} msg={msg.text} />}

        {/* Add admin form */}
        {showForm && isSuper && (
          <div className="card max-w-lg">
            <h3 className="font-semibold text-sm mb-4">Create new admin</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full name" error={errors.name?.message}>
                  <input className="input" placeholder="e.g. Jane Mwangi" {...register('name', { required: 'Required' })} />
                </Field>
                <Field label="Email" error={errors.email?.message}>
                  <input className="input" type="email" placeholder="jane@example.com" {...register('email', { required: 'Required' })} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Password" error={errors.password?.message}>
                  <input className="input" type="password" placeholder="Min 8 characters" {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} />
                </Field>
                <Field label="Role">
                  <select className="input" {...register('role')}>
                    <option value="VIEWER">VIEWER — read only</option>
                    <option value="ADMIN">ADMIN — full data access</option>
                    <option value="SUPER">SUPER — manage admins</option>
                  </select>
                </Field>
              </div>
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? <><Spinner className="mr-1.5" />Creating…</> : 'Create admin'}
              </button>
            </form>
          </div>
        )}

        {/* Role info */}
        <div className="card max-w-lg">
          <h3 className="font-semibold text-sm mb-3">Role permissions</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex gap-2"><span className={`badge bg-gray-100 text-gray-600`}>VIEWER</span><span>Read-only access to all data and reports</span></div>
            <div className="flex gap-2"><span className={`badge bg-blue-100 text-blue-800`}>ADMIN</span><span>Create/edit institutions, students, and results</span></div>
            <div className="flex gap-2"><span className={`badge bg-purple-100 text-purple-800`}>SUPER</span><span>All permissions + manage admin accounts + delete institutions</span></div>
          </div>
        </div>

        {/* Admin list */}
        {isSuper && (
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm">Admin accounts</div>
            <table className="w-full text-sm">
              <thead><tr>
                {['Name','Email','Role','Created',''].map(h => <th key={h} className="table-th">{h}</th>)}
              </tr></thead>
              <tbody>
                {isLoading
                  ? <tr><td colSpan={5}><div className="flex justify-center py-8"><Spinner /></div></td></tr>
                  : admins?.length
                    ? admins.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="table-td font-medium">
                          {a.name}
                          {a.id === admin?.id && <span className="ml-1.5 badge bg-gray-100 text-gray-500 text-[10px]">you</span>}
                        </td>
                        <td className="table-td text-gray-500">{a.email}</td>
                        <td className="table-td">{roleBadge(a.role)}</td>
                        <td className="table-td font-mono text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString('en-KE')}</td>
                        <td className="table-td">
                          {a.id !== admin?.id && (
                            <button onClick={() => handleDelete(a.id, a.name)} className="btn-danger text-xs py-1 px-2">Remove</button>
                          )}
                        </td>
                      </tr>
                    ))
                    : <tr><td colSpan={5}><Empty msg="No admins yet" /></td></tr>
                }
              </tbody>
            </table>
          </div>
        )}

        {/* Profile card */}
        <div className="card max-w-sm">
          <h3 className="font-semibold text-sm mb-3">Your profile</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div><span className="text-gray-400 w-16 inline-block">Name</span> {admin?.name}</div>
            <div><span className="text-gray-400 w-16 inline-block">Email</span> {admin?.email}</div>
            <div><span className="text-gray-400 w-16 inline-block">Role</span> {roleBadge(admin?.role ?? '')}</div>
          </div>
        </div>
      </div>
    </>
  )
}
