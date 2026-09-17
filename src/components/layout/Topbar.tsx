import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClinic } from '../../lib/store'
import { useActiveUser } from '../../lib/activeUser'
import { MIcon } from '../ui/MIcon'
import type { StaffRole } from '../../lib/types'

const roleLabels: Record<StaffRole, string> = {
  receptionist: 'Receptionist',
  nurse: 'Nurse',
  doctor: 'Doctor',
}

const primaryAction: Record<StaffRole, { label: string; to: string; icon: string }> = {
  receptionist: { label: 'Register patient', to: '/reception/register', icon: 'person_add' },
  nurse: { label: 'Vitals queue', to: '/nurse', icon: 'monitor_heart' },
  doctor: { label: 'My room', to: '/doctor', icon: 'meeting_room' },
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

const iconBtn =
  'w-11 h-11 rounded-full glass flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors'

export function Topbar() {
  const { staff } = useClinic()
  const { active, setActive, staffMember, site } = useActiveUser()
  const navigate = useNavigate()
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
  const action = primaryAction[active.role]

  return (
    <header className="sticky top-0 z-40 flex items-center justify-end gap-3 px-container-margin pt-6 pb-2">
      <button
        type="button"
        onClick={() => navigate(action.to)}
        className="liquid-glass rounded-full h-11 pl-4 pr-5 flex items-center gap-2 text-on-surface font-medium text-body-md hover:text-primary transition-colors"
      >
        <MIcon name={action.icon} className="text-[20px] text-primary" />
        {action.label}
      </button>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setShowMenu((p) => !p)}
          className="w-11 h-11 rounded-full bg-gradient-to-br from-[#9d86ff] to-[#5b3fe4] text-white font-semibold text-[13px] flex items-center justify-center shadow-[0_6px_18px_rgba(91,63,228,0.35)] ring-2 ring-white/70 hover:ring-white transition-all"
          title={staffMember?.name ?? 'Profile'}
        >
          {staffMember ? getInitials(staffMember.name) : '?'}
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-72 glass rounded-2xl shadow-modal overflow-hidden animate-fade-up z-50">
            <div className="p-4 border-b border-white/60">
              <div className="font-headline-md text-[14px] text-on-surface truncate">{staffMember?.name}</div>
              <div className="text-meta text-on-surface-variant truncate">
                {site?.name ?? '—'} · Daiko Clinic
              </div>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
                {roleLabels[active.role]}
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3 border-b border-white/60">
              <p className="text-meta text-on-surface-variant">
                Demo sign-in stands in for the platform's account + role login.
              </p>
              <div>
                <label className="text-meta font-medium text-on-surface-variant block mb-1">Role</label>
                <select
                  value={active.role}
                  onChange={(e) => {
                    const role = e.target.value as StaffRole
                    const first = staff.find((s) => s.role === role)
                    setActive({ role, staffId: first?.id ?? '' })
                  }}
                  className="field !py-2 !text-[13px]"
                >
                  {(Object.keys(roleLabels) as StaffRole[]).map((r) => (
                    <option key={r} value={r}>
                      {roleLabels[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-meta font-medium text-on-surface-variant block mb-1">Signed in as</label>
                <select
                  value={active.staffId}
                  onChange={(e) => setActive({ role: active.role, staffId: e.target.value })}
                  className="field !py-2 !text-[13px]"
                >
                  {staffForRole.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <button type="button" className={iconBtn} title="Notifications">
        <MIcon name="notifications" className="text-[21px]" />
      </button>
    </header>
  )
}
