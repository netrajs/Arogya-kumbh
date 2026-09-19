import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Input, Label, Select } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { MIcon } from '../../components/ui/MIcon'
import { useClinic } from '../../lib/store'
import { ONBOARDING_DOCUMENTS } from '../../data/onboardingDocuments'
import type { EmploymentType, OnboardingDocument } from '../../lib/types'

type OnboardableRole = 'doctor' | 'nurse' | 'receptionist'

const roleMeta: Record<
  OnboardableRole,
  { label: string; icon: string; glyphClass: string; departmentLabel: string; departmentPlaceholder: string }
> = {
  doctor: {
    label: 'Doctor',
    icon: 'stethoscope',
    glyphClass: 'title-glyph--indigo',
    departmentLabel: 'Department / Specialty',
    departmentPlaceholder: 'e.g. Cardiology',
  },
  nurse: {
    label: 'Nurse',
    icon: 'monitor_heart',
    glyphClass: 'title-glyph--blue',
    departmentLabel: 'Department / Specialty',
    departmentPlaceholder: 'e.g. General Ward',
  },
  receptionist: {
    label: 'Receptionist',
    icon: 'person_add',
    glyphClass: 'title-glyph--mint',
    departmentLabel: 'Department / Role',
    departmentPlaceholder: 'e.g. Front Desk',
  },
}

const employmentTypeLabel: Record<EmploymentType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  intern: 'Intern',
}

export function AddEmployeeModal({ onClose }: { onClose: () => void }) {
  const { state, addStaffMember } = useClinic()
  const [role, setRole] = useState<OnboardableRole | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfJoining, setDateOfJoining] = useState('')
  const [department, setDepartment] = useState('')
  const [siteId, setSiteId] = useState('')
  const [employmentType, setEmploymentType] = useState<EmploymentType>('full_time')
  const [compensation, setCompensation] = useState('')
  const [documents, setDocuments] = useState<OnboardingDocument[]>([])

  function pickRole(picked: OnboardableRole) {
    setRole(picked)
    setDocuments(ONBOARDING_DOCUMENTS[picked].map((docName) => ({ name: docName, received: false })))
  }

  function toggleDocument(docName: string) {
    setDocuments((prev) => prev.map((d) => (d.name === docName ? { ...d, received: !d.received } : d)))
  }

  const canSubmit =
    !!role &&
    name.trim() &&
    email.trim() &&
    phone.trim() &&
    dateOfJoining &&
    department.trim() &&
    siteId &&
    Number(compensation) > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role || !canSubmit) return
    addStaffMember({
      name: name.trim(),
      role,
      siteId,
      email: email.trim(),
      phone: phone.trim(),
      dateOfJoining,
      department: department.trim(),
      employmentType,
      compensation: Number(compensation),
      documents,
    })
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="card-surface w-full max-w-xl max-h-full overflow-y-auto animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/60 px-6 py-4">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            {role ? `Onboard ${roleMeta[role].label}` : 'Add Employee'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-black/5"
          >
            <MIcon name="close" className="text-lg" />
          </button>
        </div>

        {!role ? (
          <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-3">
            {(Object.keys(roleMeta) as OnboardableRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => pickRole(r)}
                className="lift group flex flex-col items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-5 transition-colors hover:border-primary/40"
              >
                <span className={`title-glyph ${roleMeta[r].glyphClass}`}>
                  <MIcon name={roleMeta[r].icon} className="text-xl" />
                </span>
                <span className="font-body-md font-semibold text-on-surface group-hover:text-primary">
                  {roleMeta[r].label}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul Patil" />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 98765 43210"
                />
              </div>
              <div>
                <Label>Date of Joining</Label>
                <Input type="date" value={dateOfJoining} onChange={(e) => setDateOfJoining(e.target.value)} />
              </div>
              <div>
                <Label>{roleMeta[role].departmentLabel}</Label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder={roleMeta[role].departmentPlaceholder}
                />
              </div>
              <div>
                <Label>Clinic / Site</Label>
                <Select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                  <option value="">Select a site</option>
                  {state.sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Employment Type</Label>
                <Select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                >
                  {(Object.keys(employmentTypeLabel) as EmploymentType[]).map((t) => (
                    <option key={t} value={t}>
                      {employmentTypeLabel[t]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Salary / Compensation (₹ / month)</Label>
                <Input
                  type="number"
                  min="0"
                  value={compensation}
                  onChange={(e) => setCompensation(e.target.value)}
                  placeholder="e.g. 60000"
                />
              </div>
            </div>

            <div>
              <Label>Required Onboarding Documents</Label>
              <ul className="space-y-1.5">
                {documents.map((doc) => (
                  <li key={doc.name} className="glass-soft flex items-center gap-2.5 rounded-xl px-3 py-2">
                    <input
                      type="checkbox"
                      checked={doc.received}
                      onChange={() => toggleDocument(doc.name)}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span className="flex-1 text-body-md text-on-surface">{doc.name}</span>
                    <span className={`text-meta font-medium ${doc.received ? 'text-[#047857]' : 'text-[#b45309]'}`}>
                      {doc.received ? 'Received' : 'Pending'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="secondary" onClick={() => setRole(null)}>
                Back
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                <MIcon name="check" className="text-lg" /> Add employee
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
