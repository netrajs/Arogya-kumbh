import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { HeartPulse } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export function Sidebar({ items }: { items: NavItem[] }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-28 flex-col items-center gap-7 bg-gradient-to-b from-brand-500 via-brand-600 to-brand-700 py-7 shadow-[8px_0_32px_rgba(74,63,176,0.28)]">
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30">
          <HeartPulse size={22} />
        </div>
        <span className="text-[10px] font-semibold tracking-wide text-white/90">Daiko</span>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              'flex w-[4.5rem] flex-col items-center gap-1 rounded-2xl py-2.5 text-[10px] font-medium transition ' +
              (isActive
                ? 'bg-white text-brand-700 shadow-lg'
                : 'text-white/75 hover:bg-white/10 hover:text-white')
            }
          >
            <Icon size={19} />
            <span className="leading-none text-center">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
