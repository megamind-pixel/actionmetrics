export function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return parseFloat(String(v)).toFixed(1) + '%'
}

export function grade(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  if (v >= 90) return 'A'
  if (v >= 75) return 'B'
  if (v >= 60) return 'C'
  if (v >= 50) return 'D'
  return 'E'
}

export function gradeColor(v: number | null | undefined): string {
  if (v === null || v === undefined) return ''
  if (v >= 90) return 'bg-emerald-100 text-emerald-800'
  if (v >= 75) return 'bg-accent-light text-accent'
  if (v >= 60) return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-700'
}

export function badgeClass(type: string): string {
  if (type === 'Primary') return 'badge-primary'
  if (type === 'Secondary') return 'badge-secondary'
  return 'badge-purple'
}

export function levelColor(level: string): string {
  if (level === 'Primary') return '#185FA5'
  if (level === 'Secondary') return '#1D9E75'
  return '#7F77DD'
}

export function clsn(...args: (string | undefined | false | null)[]): string {
  return args.filter(Boolean).join(' ')
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
}
