import React from 'react'
import { clsn } from '../../lib/utils'

// ── Spinner ───────────────────────────────────────────────────────────────
export const Spinner = ({ className }: { className?: string }) => (
  <div className={clsn('spinner', className)} />
)

// ── Empty state ───────────────────────────────────────────────────────────
export const Empty = ({ msg = 'No data yet' }: { msg?: string }) => (
  <div className="text-center py-8 text-gray-400 text-sm">{msg}</div>
)

// ── Alert ─────────────────────────────────────────────────────────────────
export const Alert = ({ type, msg }: { type: 'success' | 'error' | 'warn'; msg: string }) => {
  const cls = { success: 'alert-success', error: 'alert-error', warn: 'alert-warn' }[type]
  return <div className={cls}>{msg}</div>
}

// ── Progress bar ──────────────────────────────────────────────────────────
export const ProgressBar = ({ value, color }: { value: number; color: string }) => (
  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden mx-2">
    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, value)}%`, background: color }} />
  </div>
)

// ── Stat card ─────────────────────────────────────────────────────────────
export const StatCard = ({
  label, value, sub, accent,
}: { label: string; value: string | number; sub?: string; accent?: boolean }) => (
  <div className={clsn('stat-card', accent && 'border-accent bg-accent-light')}>
    <div className={clsn('text-xs font-medium uppercase tracking-wide mb-1', accent ? 'text-accent-hover' : 'text-gray-500')}>{label}</div>
    <div className={clsn('text-2xl font-semibold tabular-nums', accent && 'text-accent')}>{value}</div>
    {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
  </div>
)

// ── Modal ─────────────────────────────────────────────────────────────────
export const Modal = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
      </div>
      {children}
    </div>
  </div>
)

// ── Form field ────────────────────────────────────────────────────────────
export const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
  </div>
)

// ── Grade pill ────────────────────────────────────────────────────────────
export const GradePill = ({ value }: { value: number | null }) => {
  if (value === null) return <span className="text-gray-400">—</span>
  const g = value >= 90 ? 'A' : value >= 75 ? 'B' : value >= 60 ? 'C' : value >= 50 ? 'D' : 'E'
  const cls = value >= 90 ? 'bg-emerald-100 text-emerald-800' : value >= 75 ? 'bg-blue-100 text-blue-800' : value >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
  return <span className={`badge ${cls}`}>{g}</span>
}

// ── Section header ────────────────────────────────────────────────────────
export const SectionHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-semibold">{title}</h3>
    {action}
  </div>
)
