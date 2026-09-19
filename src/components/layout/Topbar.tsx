import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveUser } from '../../lib/activeUser'
import { useAuth } from '../../lib/AuthContext'
import { MIcon } from '../ui/MIcon'
import type { StaffRole } from '../../lib/types'

const roleLabels: Record<StaffRole, string> = {
  receptionist: 'Receptionist',
  nurse: 'Nurse',
  doctor: 'Doctor',
  hr: 'HR',
}

const primaryAction: Record<StaffRole, { label: string; to: string; icon: string }> = {
  receptionist: { label: 'Register patient', to: '/reception/register', icon: 'person_add' },
  nurse: { label: 'Vitals queue', to: '/nurse', icon: 'monitor_heart' },
  doctor: { label: 'My room', to: '/doctor', icon: 'meeting_room' },
  hr: { label: 'HR Dashboard', to: '/hr', icon: 'badge' },
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
  const { active, staffMember, site } = useActiveUser()
  const { user, logout } = useAuth()
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

  const action = primaryAction[active.role]
  const displayName = staffMember?.name ?? user?.email ?? 'Profile'

  function handleLogout() {
    setShowMenu(false)
    logout()
    navigate('/login', { replace: true })
  }

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
          title={displayName}
        >
          {getInitials(displayName)}
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-72 glass rounded-2xl shadow-modal overflow-hidden animate-fade-up z-50">
            <div className="p-4 border-b border-white/60">
              <div className="font-headline-md text-[14px] text-on-surface truncate">{displayName}</div>
              <div className="text-meta text-on-surface-variant truncate">{user?.email}</div>
              <div className="text-meta text-on-surface-variant truncate">{site?.name ?? '—'} · Daiko Clinic</div>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
                {roleLabels[active.role]}
              </div>
            </div>

            <div className="p-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-body-md text-body-md text-on-surface hover:bg-black/5"
              >
                <MIcon name="logout" className="text-lg text-on-surface-variant" />
                Log out
              </button>
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
