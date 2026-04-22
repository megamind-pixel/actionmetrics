import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogin } from '../../hooks/useApi'
import { useAuthStore } from '../../store/auth'
import { Spinner } from '../../components/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { mutateAsync: login, isPending } = useLogin()
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const { token, admin } = await login({ email, password })
      setAuth(token, admin)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-xl font-semibold text-accent tracking-tight mb-1">ActionMetrics</div>
          <div className="text-xs text-gray-400">Kenya Education Platform</div>
        </div>

        <h2 className="text-base font-semibold mb-5">Sign in to continue</h2>

        {error && <div className="alert-error mb-4">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email address</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@actionmetrics.ke"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" disabled={isPending} className="btn-primary w-full justify-center py-2 mt-2">
            {isPending ? <><Spinner className="mr-1" /> Signing in…</> : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Default: admin@actionmetrics.ke / Admin1234!<br/>
          (Run <code className="font-mono bg-gray-100 px-1 rounded">npm run db:seed</code> first)
        </p>
      </div>
    </div>
  )
}
