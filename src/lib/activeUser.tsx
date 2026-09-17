import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { StaffRole } from './types'
import { useClinic } from './store'

const KEY = 'arogya-kumbh-active-user-v1'

interface ActiveUser {
  role: StaffRole
  staffId: string
}

interface ActiveUserApi {
  active: ActiveUser
  setActive: (u: ActiveUser) => void
}

const Ctx = createContext<ActiveUserApi | null>(null)

function load(): ActiveUser {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return { role: 'receptionist', staffId: 'st-1' }
}

export function ActiveUserProvider({ children }: { children: ReactNode }) {
  const [active, setActiveState] = useState<ActiveUser>(load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(active))
  }, [active])

  const setActive = (u: ActiveUser) => setActiveState(u)

  return <Ctx.Provider value={{ active, setActive }}>{children}</Ctx.Provider>
}

export function useActiveUser() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useActiveUser must be used within ActiveUserProvider')
  const { staff } = useClinic()
  const staffMember = staff.find((s) => s.id === ctx.active.staffId)
  return { ...ctx, staffMember }
}
