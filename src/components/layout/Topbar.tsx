import { useEffect, useRef, useState } from 'react'
import { useClinic } from '../../lib/store'
import { useActiveUser } from '../../lib/activeUser'
import { MIcon } from '../ui/MIcon'
import type { StaffRole } from '../../lib/types'

const roleLabels: Record<StaffRole, string> = {
  receptionist: 'Receptionist',
  nurse: 'Nurse',
  doctor: 'Doctor',
}

function getInitials(name: string) {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Topbar() {
  const { staff } = useClinic()
  const { active, setActive, staffMember, site } = useActiveUser()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const staffForRole = staff.filter((s) => s.role === active.role)

  return (
    <header className="fixed top-0 left-[88px] right-0 h-20 bg-surface/80 backdrop-blur-xl z-40 flex items-center justify-between px-container-margin gap-8">
      <div className="flex-1 max-w-xl">
        <div className="relative flex items-center w-full">
          <MIcon name="search" className="absolute left-5 text-on-surface-variant" />
          <input
            className="w-full h-12 bg-surface-container-low border-none rounded-full pl-12 pr-6 text-body-md focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            placeholder="Search patients, tokens…"
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 rounded-full hover:bg-surface-container-high transition-colors">
          <MIcon name="notifications" className="text-on-surface-variant" />
        </button>

        <div className="relative" ref={menuRef}>
          <div
            className="flex items-center gap-4 border-l border-outline-variant pl-6 cursor-pointer"
            onClick={() => setShowMenu((prev) => !prev)}
          >
            <div className="hidden sm:block text-right">
              <p className="font-headline-md text-on-surface text-sm">{staffMember?.name ?? 'User'}</p>
              <p className="text-meta text-on-surface-variant capitalize">
                {roleLabels[active.role]} · {site?.name ?? '—'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
              {staffMember ? getInitials(staffMember.name) : '?'}
            </div>
          </div>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-surface-container-lowest rounded-xl shadow-modal border border-outline-variant/30 overflow-hidden z-50">
              <div className="p-4 border-b border-surface-container-high/50">
                <p className="text-meta font-meta text-on-surface-variant uppercase tracking-wider mb-1">
                  Demo sign-in (stands in for platform login)
                </p>
                <p className="text-body-md text-on-surface-variant">
                  Real deployments authenticate via the platform's existing account + role system.
                </p>
              </div>

              <div className="p-4 flex flex-col gap-3">
                <label className="text-meta font-meta text-on-surface-variant uppercase tracking-wider">Role</label>
                <select
                  value={active.role}
                  onChange={(e) => {
                    const role = e.target.value as StaffRole
                    const first = staff.find((s) => s.role === role)
                    setActive({ role, staffId: first?.id ?? '' })
                  }}
                  className="h-10 rounded-control border border-outline-variant bg-surface-container-lowest px-3 text-body-md outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {(Object.keys(roleLabels) as StaffRole[]).map((r) => (
                    <option key={r} value={r}>
                      {roleLabels[r]}
                    </option>
                  ))}
                </select>

                <label className="text-meta font-meta text-on-surface-variant uppercase tracking-wider mt-1">
                  Signed in as
                </label>
                <select
                  value={active.staffId}
                  onChange={(e) => setActive({ role: active.role, staffId: e.target.value })}
                  className="h-10 rounded-control border border-outline-variant bg-surface-container-lowest px-3 text-body-md outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {staffForRole.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
