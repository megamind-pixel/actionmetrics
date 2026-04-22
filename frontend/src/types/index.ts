export type Role = 'SUPER' | 'ADMIN' | 'VIEWER'
export type InstitutionType = 'Primary' | 'Secondary' | 'University'
export type Level = 'Primary' | 'Secondary' | 'University'
export type ScoreType = 'percent' | 'gpa'

export interface Admin {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

export interface Institution {
  id: string
  instId: string
  name: string
  type: InstitutionType
  county?: string
  students: number
  avg: number | null
  createdAt: string
}

export interface Student {
  id: string
  stuId: string
  name: string
  instId: string
  instName: string
  level: Level
  class: string
  programme?: string
  mean: number | null
  createdAt: string
}

export interface Result {
  id: string
  stuId: string
  stuName: string
  subject: string
  score: number
  scoreType: ScoreType
  normalised: number
  term: string
  year: string
  createdAt: string
}

export interface Overview {
  institutions: number
  students: number
  results: number
  system_avg: number | null
  activity: ActivityEntry[]
}

export interface ActivityEntry {
  id: string
  message: string
  createdAt: string
}

export interface LevelStat {
  level: Level
  students: number
  avg: number | null
}

export interface InstitutionStat {
  instId: string
  name: string
  type: InstitutionType
  county: string | null
  students: number
  avg: number | null
}

export interface SubjectStat {
  subject: string
  count: number
  avg: number
  min: number
  max: number
}

export interface TrendStat {
  term: string
  year: string
  level: Level
  avg: number
  count: number
}

export interface Distribution {
  fail: number
  pass: number
  merit: number
  distinction: number
}

export interface IndividualData {
  profile: Student & { mean: number | null }
  subjects: { subject: string; avg: number; count: number }[]
  trends: { term: string; year: string; avg: number }[]
  rank: number
  class_size: number
}
