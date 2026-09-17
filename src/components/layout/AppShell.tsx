import type { ReactNode } from 'react'
import { UserPlus, ListOrdered, Activity, DoorOpen, Stethoscope } from 'lucide-react'
import { Sidebar, type NavItem } from './Sidebar'
import { useActiveUser } from '../../lib/activeUser'
import type { StaffRole } from '../../lib/types'

const navByRole: Record<StaffRole, NavItem[]> = {
  receptionist: [
    { to: '/reception/register', label: 'Register', icon: UserPlus },
    { to: '/reception/queues', label: 'Queues', icon: ListOrdered },
    { to: '/doctors', label: 'Doctors', icon: Stethoscope },
  ],
  nurse: [
    { to: '/nurse', label: 'Vitals', icon: Activity },
    { to: '/doctors', label: 'Doctors', icon: Stethoscope },
  ],
  doctor: [
    { to: '/doctor', label: 'My Room', icon: DoorOpen },
    { to: '/doctors', label: 'Doctors', icon: Stethoscope },
  ],
}

export function AppShell({ children }: { children: ReactNode }) {
  const { active } = useActiveUser()
  const items = navByRole[active.role]

  return (
    <div className="mx-auto flex max-w-7xl gap-4 p-4">
      <Sidebar items={items} />
      <main className="min-w-0 flex-1 py-2">{children}</main>
    </div>
  )
}
