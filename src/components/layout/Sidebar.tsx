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
    <aside className="sticky top-4 flex h-[calc(100vh-2rem)] w-24 flex-col items-center gap-6 rounded-3xl bg-gradient-to-b from-brand-500 to-brand-700 py-6 shadow-[0_12px_40px_rgba(74,63,176,0.35)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white">
        <HeartPulse size={22} />
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              'flex w-16 flex-col items-center gap-1 rounded-2xl py-2.5 text-[10px] font-medium transition ' +
              (isActive
                ? 'bg-white/95 text-brand-700 shadow-md'
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
