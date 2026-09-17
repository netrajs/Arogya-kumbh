import { Bell, LogOut } from 'lucide-react'
import { useClinic } from '../../lib/store'
import { useActiveUser } from '../../lib/activeUser'
import { Avatar } from '../ui/Avatar'
import { Select } from '../ui/Field'
import type { StaffRole } from '../../lib/types'

const roleLabels: Record<StaffRole, string> = {
  receptionist: 'Receptionist',
  nurse: 'Nurse',
  doctor: 'Doctor',
}

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { staff } = useClinic()
  const { active, setActive, staffMember } = useActiveUser()

  const staffForRole = staff.filter((s) => s.role === active.role)

  return (
    <header className="no-print mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#211c37]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[#7a7396]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={active.role}
          onChange={(e) => {
            const role = e.target.value as StaffRole
            const first = staff.find((s) => s.role === role)
            setActive({ role, staffId: first?.id ?? '' })
          }}
          className="!w-auto rounded-full py-2"
        >
          {(Object.keys(roleLabels) as StaffRole[]).map((r) => (
            <option key={r} value={r}>
              Acting as: {roleLabels[r]}
            </option>
          ))}
        </Select>

        <Select
          value={active.staffId}
          onChange={(e) => setActive({ role: active.role, staffId: e.target.value })}
          className="!w-auto rounded-full py-2"
        >
          {staffForRole.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>

        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/70 text-[#5b5478] shadow-sm hover:bg-white">
          <Bell size={18} />
        </button>

        {staffMember && <Avatar name={staffMember.name} size={40} />}

        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/70 text-[#5b5478] shadow-sm hover:bg-white">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
