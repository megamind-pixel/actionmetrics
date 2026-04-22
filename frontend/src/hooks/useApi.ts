import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type {
  Overview, LevelStat, InstitutionStat, SubjectStat, TrendStat,
  Distribution, IndividualData, Institution, Student, Result, Admin
} from '../types'

// ── Auth ──────────────────────────────────────────────────────────────────
export const useMe = () =>
  useQuery({ queryKey: ['me'], queryFn: () => api.get<Admin>('/auth/me').then(r => r.data) })

export const useAdmins = () =>
  useQuery({ queryKey: ['admins'], queryFn: () => api.get<Admin[]>('/auth/admins').then(r => r.data) })

export const useLogin = () =>
  useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post<{ token: string; admin: Admin }>('/auth/login', data).then(r => r.data),
  })

export const useRegisterAdmin = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role: string }) =>
      api.post<Admin>('/auth/register', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admins'] }),
  })
}

export const useDeleteAdmin = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/auth/admins/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admins'] }),
  })
}

// ── Institutions ──────────────────────────────────────────────────────────
export const useInstitutions = () =>
  useQuery({ queryKey: ['institutions'], queryFn: () => api.get<Institution[]>('/institutions').then(r => r.data) })

export const useCreateInstitution = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; type: string; county?: string }) =>
      api.post<Institution>('/institutions', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institutions'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export const useDeleteInstitution = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (instId: string) => api.delete(`/institutions/${instId}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institutions'] })
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

// ── Students ──────────────────────────────────────────────────────────────
export const useStudents = () =>
  useQuery({ queryKey: ['students'], queryFn: () => api.get<Student[]>('/students').then(r => r.data) })

export const useCreateStudent = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: object) => api.post<Student>('/students', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export const useDeleteStudent = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stuId: string) => api.delete(`/students/${stuId}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

// ── Results ───────────────────────────────────────────────────────────────
export const useResults = (params?: { stuId?: string; year?: string; term?: string }) =>
  useQuery({
    queryKey: ['results', params],
    queryFn: () => api.get<Result[]>('/results', { params }).then(r => r.data),
  })

export const useCreateResult = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: object) => api.post<Result>('/results', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results'] })
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export const useBulkResults = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: object[]) =>
      api.post<{ inserted: number; skipped: number; errors: string[] }>('/results/bulk', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results'] })
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export const useDeleteResult = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/results/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['results'] }),
  })
}

// ── Analytics ─────────────────────────────────────────────────────────────
export const useOverview = () =>
  useQuery({ queryKey: ['analytics', 'overview'], queryFn: () => api.get<Overview>('/analytics/overview').then(r => r.data) })

export const useLevels = () =>
  useQuery({ queryKey: ['analytics', 'levels'], queryFn: () => api.get<LevelStat[]>('/analytics/levels').then(r => r.data) })

export const useInstitutionStats = (type?: string) =>
  useQuery({
    queryKey: ['analytics', 'institutions', type],
    queryFn: () => api.get<InstitutionStat[]>('/analytics/institutions', { params: type ? { type } : {} }).then(r => r.data),
  })

export const useSubjectStats = () =>
  useQuery({ queryKey: ['analytics', 'subjects'], queryFn: () => api.get<SubjectStat[]>('/analytics/subjects').then(r => r.data) })

export const useTrends = () =>
  useQuery({ queryKey: ['analytics', 'trends'], queryFn: () => api.get<TrendStat[]>('/analytics/trends').then(r => r.data) })

export const useDistribution = () =>
  useQuery({ queryKey: ['analytics', 'distribution'], queryFn: () => api.get<Distribution>('/analytics/distribution').then(r => r.data) })

export const useIndividual = (stuId: string) =>
  useQuery({
    queryKey: ['analytics', 'individual', stuId],
    queryFn: () => api.get<IndividualData>(`/analytics/individual/${stuId}`).then(r => r.data),
    enabled: !!stuId,
  })
