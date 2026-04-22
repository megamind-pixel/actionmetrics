import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Admin } from '../types'

interface AuthState {
  token: string | null
  admin: Admin | null
  setAuth: (token: string, admin: Admin) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      setAuth: (token, admin) => set({ token, admin }),
      logout: () => set({ token: null, admin: null }),
    }),
    { name: 'am-auth' }
  )
)
