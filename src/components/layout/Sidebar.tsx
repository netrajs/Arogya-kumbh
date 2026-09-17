import { NavLink } from 'react-router-dom'
import { DaikoLogo } from '../ui/DaikoLogo'

export interface NavItem {
  to: string
  label: string
  icon: string
  badge?: number
}

export function Sidebar({ items, portalLabel = 'Clinic' }: { items: NavItem[]; portalLabel?: string }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[112px] p-3 z-50">
      <div className="bg-sidebar-gradient h-full w-full rounded-[28px] flex flex-col items-center py-6 shadow-[0_18px_50px_rgba(75,47,208,0.35)] relative overflow-hidden">
        {/* Specular sheen along the top edge of the rail */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/25 to-transparent" />

        {/* Logo — on a light tile, so the indigo half of the mark still reads
            against the indigo rail. */}
        <div className="relative mb-8 shrink-0">
          <div
            className="w-12 h-12 rounded-2xl bg-white/95 flex items-center justify-center shadow-[0_6px_18px_rgba(20,10,60,0.28)]"
            title="Daiko"
          >
            <DaikoLogo className="w-8 h-8" />
          </div>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 flex flex-col gap-1.5 w-full px-2.5 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                `group relative flex flex-col items-center gap-1 rounded-2xl py-3 px-1 transition-all duration-200 ${
                  isActive ? 'glass-on-dark text-white' : 'text-white/65 hover:text-white hover:bg-white/10'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <span
                      className="material-symbols-rounded text-[23px] leading-none"
                      style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon}
                    </span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-tertiary text-white text-[10px] font-semibold rounded-full flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] leading-[13px] font-medium text-center tracking-tight px-0.5">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Portal badge */}
        <div className="relative mt-3 shrink-0">
          <div
            className="w-10 h-10 rounded-full glass-on-dark flex items-center justify-center text-white/80 text-[11px] font-semibold"
            title={`${portalLabel} portal`}
          >
            {portalLabel.slice(0, 2)}
          </div>
        </div>
      </div>
    </aside>
  )
}
