import type { ReactNode } from 'react'
import { Sidebar, type NavItem } from './Sidebar'
import { Topbar } from './Topbar'
import { useActiveUser } from '../../lib/activeUser'
import type { StaffRole } from '../../lib/types'

const navByRole: Record<StaffRole, NavItem[]> = {
  receptionist: [
    { to: '/reception/register', label: 'Register', icon: 'person_add' },
    { to: '/reception/queues', label: 'Queues', icon: 'format_list_bulleted' },
    { to: '/doctors', label: 'Doctors', icon: 'stethoscope' },
  ],
  nurse: [
    { to: '/nurse', label: 'Vitals', icon: 'monitor_heart' },
    { to: '/doctors', label: 'Doctors', icon: 'stethoscope' },
  ],
  doctor: [
    { to: '/doctor', label: 'My Room', icon: 'meeting_room' },
    { to: '/doctors', label: 'Doctors', icon: 'stethoscope' },
  ],
  hr: [{ to: '/hr', label: 'Dashboard', icon: 'dashboard' }],
}

const portalLabel: Record<StaffRole, string> = {
  receptionist: 'Reception',
  nurse: 'Nurse',
  doctor: 'Doctor',
  hr: 'HR',
}

export function AppShell({ children }: { children: ReactNode }) {
  const { active } = useActiveUser()
  const items = navByRole[active.role]

  return (
    <div className="app-canvas font-body-md text-on-surface min-h-screen">
      <Sidebar items={items} portalLabel={portalLabel[active.role]} />
      <div className="pl-[112px] flex flex-col min-h-screen">
        <Topbar />
        <main className="relative px-container-margin pb-section-gap flex-1 max-w-[1680px]">{children}</main>
      </div>
    </div>
  )
}
