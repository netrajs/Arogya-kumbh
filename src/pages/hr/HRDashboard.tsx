import { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Panel } from '../../components/ui/Panel'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { MIcon } from '../../components/ui/MIcon'
import { useClinic } from '../../lib/store'
import { useActiveUser } from '../../lib/activeUser'
import { AddEmployeeModal } from './AddEmployeeModal'
import type { StaffRole } from '../../lib/types'

const roleLabel: Record<StaffRole, string> = {
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  hr: 'HR',
}

const glyphTones = ['title-glyph--indigo', 'title-glyph--blue', 'title-glyph--mint'] as const

function StatTile({ icon, label, value, tone }: { icon: string; label: string; value: number; tone: number }) {
  return (
    <div className="card-surface p-card-padding flex items-center gap-4">
      <span className={`title-glyph ${glyphTones[tone % glyphTones.length]}`}>
        <MIcon name={icon} className="text-[17px]" />
      </span>
      <div>
        <p className="font-headline-lg text-headline-lg text-on-surface">{value}</p>
        <p className="text-meta text-on-surface-variant">{label}</p>
      </div>
    </div>
  )
}

export function HRDashboard() {
  const { state, setStaffStatus } = useClinic()
  const { site } = useActiveUser()
  const [showAddEmployee, setShowAddEmployee] = useState(false)

  const staff = state.staff.filter((s) => s.role !== 'hr')
  const doctors = staff.filter((s) => s.role === 'doctor')
  const nurses = staff.filter((s) => s.role === 'nurse')
  const receptionists = staff.filter((s) => s.role === 'receptionist')
  const activeStaff = staff.filter((s) => s.status === 'active')
  const pendingStaff = staff.filter((s) => s.status === 'pending')

  const recent = [...staff].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)

  return (
    <div className="flex flex-col w-full gap-gutter animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="HR Dashboard" description={<>Daiko Clinic · {site?.name ?? 'All sites'}</>} />
        <Button size="lg" onClick={() => setShowAddEmployee(true)}>
          <MIcon name="person_add" className="text-lg" /> Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-gutter sm:grid-cols-3 xl:grid-cols-6">
        <StatTile icon="stethoscope" label="Total Doctors" value={doctors.length} tone={0} />
        <StatTile icon="monitor_heart" label="Total Nurses" value={nurses.length} tone={1} />
        <StatTile icon="person_add" label="Total Receptionists" value={receptionists.length} tone={2} />
        <StatTile icon="groups" label="Total Staff" value={staff.length} tone={0} />
        <StatTile icon="check_circle" label="Active Staff" value={activeStaff.length} tone={1} />
        <StatTile icon="hourglass_empty" label="Pending Onboarding" value={pendingStaff.length} tone={2} />
      </div>

      <Panel glyph="apartment" glyphClass="title-glyph title-glyph--blue" title="Site-wise Staff Breakdown">
        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="text-left text-meta uppercase tracking-wide text-on-surface-variant">
                <th className="py-2 pr-4">Clinic / Site</th>
                <th className="py-2 pr-4">Doctors</th>
                <th className="py-2 pr-4">Nurses</th>
                <th className="py-2 pr-4">Receptionists</th>
              </tr>
            </thead>
            <tbody>
              {state.sites.map((s) => (
                <tr key={s.id} className="border-t border-outline-variant/40">
                  <td className="py-2.5 pr-4 font-medium text-on-surface">{s.name}</td>
                  <td className="py-2.5 pr-4">{doctors.filter((d) => d.siteId === s.id).length}</td>
                  <td className="py-2.5 pr-4">{nurses.filter((n) => n.siteId === s.id).length}</td>
                  <td className="py-2.5 pr-4">{receptionists.filter((r) => r.siteId === s.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel glyph="history" glyphClass="title-glyph title-glyph--mint" title="Recent Employees / Onboarding">
        {recent.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">No employees onboarded yet.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((employee) => {
              const employeeSite = state.sites.find((s) => s.id === employee.siteId)
              return (
                <li
                  key={employee.id}
                  className="glass-soft flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-body-md font-medium text-on-surface">{employee.name}</p>
                    <p className="text-meta text-on-surface-variant">
                      {roleLabel[employee.role]} · {employeeSite?.name ?? '—'} · Joined{' '}
                      {employee.dateOfJoining || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={employee.status === 'active' ? 'active' : 'pending'}>
                      {employee.status === 'active' ? 'Active' : 'Pending'}
                    </Badge>
                    {employee.status === 'pending' && (
                      <Button size="sm" variant="secondary" onClick={() => setStaffStatus(employee.id, 'active')}>
                        Mark Active
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      {showAddEmployee && <AddEmployeeModal onClose={() => setShowAddEmployee(false)} />}
    </div>
  )
}
