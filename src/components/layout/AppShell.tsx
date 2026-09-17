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

function BackgroundBlobs() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-16 -top-24 h-[26rem] w-[26rem] rounded-full bg-brand-300/45 blur-[100px]" />
      <div className="absolute right-[-6rem] top-1/4 h-[24rem] w-[24rem] rounded-full bg-fuchsia-300/35 blur-[100px]" />
      <div className="absolute bottom-[-8rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-amber-200/40 blur-[110px]" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-sky-200/35 blur-[90px]" />
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { active } = useActiveUser()
  const items = navByRole[active.role]

  return (
    <div className="min-h-screen">
      <BackgroundBlobs />
      <Sidebar items={items} />
      <main className="ml-28 min-w-0 px-6 py-6 sm:px-10 sm:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
