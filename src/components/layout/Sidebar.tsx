import { NavLink } from 'react-router-dom'
import { MIcon } from '../ui/MIcon'

export interface NavItem {
  to: string
  label: string
  icon: string
}

export function Sidebar({ items, portalLabel = 'Clinic' }: { items: NavItem[]; portalLabel?: string }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-[88px] bg-sidebar-gradient z-50 flex flex-col items-center py-6 shadow-[4px_0_24px_rgba(0,0,0,0.05)]">
      <div className="mb-10 px-4 flex flex-col items-center">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white mb-2">
          <MIcon name="medical_services" />
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-4 w-full px-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.label}
            className={({ isActive }) =>
              `relative flex items-center justify-center w-full aspect-square transition-all rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <MIcon name={item.icon} className="text-[28px]" />
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pb-4">
        <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-white/50 text-xs">
          {portalLabel.charAt(0)}
        </div>
      </div>
    </aside>
  )
}
