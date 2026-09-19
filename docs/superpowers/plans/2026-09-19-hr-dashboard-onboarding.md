# HR Dashboard & Employee Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `hr` role with a staff-insights dashboard and a Doctor/Nurse/Receptionist onboarding flow, built entirely on the app's existing client-side store, demo role switcher, and UI components.

**Architecture:** Extend the existing `ClinicState`/`ClinicApi` (`src/lib/store.tsx`) with staff-onboarding fields and two new mutators (`addStaffMember`, `setStaffStatus`); add two new page components under `src/pages/hr/`; wire `hr` into the existing per-role nav/routing tables. No new backend, no new auth, no new persistence mechanism.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind, `react-router-dom`. No test runner is configured in this repo (`package.json` has no test script/dependency) — verification throughout this plan is `npx tsc -b` (type safety), `npm run lint` (oxlint), and manual checks in the running dev server via the Browser preview tool, matching how the rest of this codebase is verified.

**Spec:** [docs/superpowers/specs/2026-09-19-hr-dashboard-onboarding-design.md](../specs/2026-09-19-hr-dashboard-onboarding-design.md)

## Global Constraints

- Do not modify Reception/Nurse/Doctor/queue/prescription behavior.
- No new backend, database, authentication, or file-upload infrastructure — reuse the existing `ClinicProvider` localStorage store and the existing demo "Signed in as" switcher.
- Every `StaffMember` field beyond `id/name/role/siteId` is new and required going forward; existing/older localStorage data must be migrated on load, not crash (follow the pattern already used for `dailyTokenCounters` in `src/lib/store.tsx`).
- No charts on the HR dashboard — stat tiles + two tables only.
- Onboarding documents are a checklist (name + received boolean) — no real file storage.

---

### Task 1: Types and store — staff data model, migration, mutators

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/store.tsx`

**Interfaces:**
- Produces (for later tasks): `StaffRole` now includes `'hr'`; new exported types `EmploymentType`, `StaffStatus`, `OnboardingDocument`; `StaffMember` gains `email: string`, `phone: string`, `dateOfJoining: string`, `department: string`, `employmentType: EmploymentType`, `compensation: number`, `status: StaffStatus`, `documents: OnboardingDocument[]`, `createdAt: string`. `useClinic()` gains `addStaffMember(input): StaffMember` and `setStaffStatus(staffId: string, status: StaffStatus): void`.

- [ ] **Step 1: Update `src/lib/types.ts`**

Replace the top of the file (the `StaffRole` type and `StaffMember` interface) with:

```ts
export type StaffRole = 'receptionist' | 'nurse' | 'doctor' | 'hr'

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern'

export type StaffStatus = 'pending' | 'active'

export interface OnboardingDocument {
  name: string
  received: boolean
}

export interface Site {
  id: string
  name: string
}

export interface StaffMember {
  id: string
  name: string
  role: StaffRole
  siteId: string
  email: string
  phone: string
  dateOfJoining: string
  department: string
  employmentType: EmploymentType
  compensation: number
  status: StaffStatus
  documents: OnboardingDocument[]
  createdAt: string
}
```

(Keep every other type in the file — `Room`, `Gender`, `Patient`, `VisitStatus`, `Vitals`, `PrescriptionItem`, `Consultation`, `Visit` — unchanged.)

- [ ] **Step 2: Run the type checker to confirm the expected breakage**

Run: `npx tsc -b`
Expected: FAIL — `src/lib/store.tsx` errors because `seedStaff` entries are missing the new required `StaffMember` fields.

- [ ] **Step 3: Update the imports and seed data in `src/lib/store.tsx`**

Change the type import line to:

```ts
import type { Patient, Room, Site, StaffMember, Visit, Vitals, Consultation, EmploymentType, StaffStatus, OnboardingDocument } from './types'
```

Replace the `seedStaff` array with (every existing staff member fully populated, plus two new HR seed members — one per site — so the demo "Signed in as" switcher has someone to pick under the HR role):

```ts
const seedStaff: StaffMember[] = [
  {
    id: 'st-1', name: 'Sara Khan', role: 'receptionist', siteId: 'site-a',
    email: 'sara.khan@daikoclinic.example', phone: '9800000001', dateOfJoining: '2024-01-15',
    department: 'Front Desk', employmentType: 'full_time', compensation: 25000,
    status: 'active', documents: [], createdAt: '2024-01-15T09:00:00.000Z',
  },
  {
    id: 'st-2', name: 'Priya Shah', role: 'nurse', siteId: 'site-a',
    email: 'priya.shah@daikoclinic.example', phone: '9800000002', dateOfJoining: '2023-11-01',
    department: 'General Ward', employmentType: 'full_time', compensation: 32000,
    status: 'active', documents: [], createdAt: '2023-11-01T09:00:00.000Z',
  },
  {
    id: 'st-3', name: 'Dr. Arjun Mehta', role: 'doctor', siteId: 'site-a',
    email: 'arjun.mehta@daikoclinic.example', phone: '9800000003', dateOfJoining: '2022-06-10',
    department: 'General Medicine', employmentType: 'full_time', compensation: 120000,
    status: 'active', documents: [], createdAt: '2022-06-10T09:00:00.000Z',
  },
  {
    id: 'st-4', name: 'Dr. Kavita Rao', role: 'doctor', siteId: 'site-a',
    email: 'kavita.rao@daikoclinic.example', phone: '9800000004', dateOfJoining: '2023-02-20',
    department: 'Pediatrics', employmentType: 'full_time', compensation: 115000,
    status: 'active', documents: [], createdAt: '2023-02-20T09:00:00.000Z',
  },
  {
    id: 'st-6', name: 'Neha Verma', role: 'receptionist', siteId: 'site-b',
    email: 'neha.verma@daikoclinic.example', phone: '9800000006', dateOfJoining: '2023-09-05',
    department: 'Front Desk', employmentType: 'full_time', compensation: 24000,
    status: 'active', documents: [], createdAt: '2023-09-05T09:00:00.000Z',
  },
  {
    id: 'st-7', name: 'Rina Kapoor', role: 'nurse', siteId: 'site-b',
    email: 'rina.kapoor@daikoclinic.example', phone: '9800000007', dateOfJoining: '2023-10-12',
    department: 'General Ward', employmentType: 'full_time', compensation: 31000,
    status: 'active', documents: [], createdAt: '2023-10-12T09:00:00.000Z',
  },
  {
    id: 'st-5', name: 'Dr. Imran Sheikh', role: 'doctor', siteId: 'site-b',
    email: 'imran.sheikh@daikoclinic.example', phone: '9800000005', dateOfJoining: '2022-08-18',
    department: 'General Medicine', employmentType: 'full_time', compensation: 118000,
    status: 'active', documents: [], createdAt: '2022-08-18T09:00:00.000Z',
  },
  {
    id: 'st-8', name: 'Ananya Gupta', role: 'hr', siteId: 'site-a',
    email: 'ananya.gupta@daikoclinic.example', phone: '9800000008', dateOfJoining: '2023-06-01',
    department: 'Human Resources', employmentType: 'full_time', compensation: 45000,
    status: 'active', documents: [], createdAt: '2023-06-01T09:00:00.000Z',
  },
  {
    id: 'st-9', name: 'Vikram Nair', role: 'hr', siteId: 'site-b',
    email: 'vikram.nair@daikoclinic.example', phone: '9800000009', dateOfJoining: '2023-07-01',
    department: 'Human Resources', employmentType: 'full_time', compensation: 45000,
    status: 'active', documents: [], createdAt: '2023-07-01T09:00:00.000Z',
  },
]
```

- [ ] **Step 4: Migrate old localStorage staff records in `loadState`**

Replace the `loadState` function with:

```ts
function loadState(): ClinicState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ClinicState
      // Older data predates dailyTokenCounters and the staff onboarding
      // fields below — patch both in so existing localStorage doesn't crash.
      return {
        ...parsed,
        dailyTokenCounters: parsed.dailyTokenCounters ?? {},
        staff: parsed.staff.map((s) => ({
          email: '',
          phone: '',
          dateOfJoining: '',
          department: '',
          employmentType: 'full_time' as EmploymentType,
          compensation: 0,
          status: 'active' as StaffStatus,
          documents: [] as OnboardingDocument[],
          createdAt: '2024-01-01T00:00:00.000Z',
          ...s,
        })),
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return {
    sites: seedSites,
    staff: seedStaff,
    rooms: seedRooms,
    patients: [],
    visits: [],
    dailyTokenCounters: {},
  }
}
```

- [ ] **Step 5: Add the two new methods to the `ClinicApi` interface**

In the `ClinicApi` interface, after `roomsForSite`, add:

```ts
  addStaffMember: (input: {
    name: string
    role: 'doctor' | 'nurse' | 'receptionist'
    siteId: string
    email: string
    phone: string
    dateOfJoining: string
    department: string
    employmentType: EmploymentType
    compensation: number
    documents: OnboardingDocument[]
  }) => StaffMember
  setStaffStatus: (staffId: string, status: StaffStatus) => void
```

- [ ] **Step 6: Implement the two methods**

Inside the `api = useMemo<ClinicApi>(() => { ... })` object, after `roomsForSite: (siteId) => state.rooms.filter((r) => r.siteId === siteId),`, add:

```ts

      addStaffMember: (input) => {
        const member: StaffMember = {
          id: `st-${crypto.randomUUID()}`,
          name: input.name,
          role: input.role,
          siteId: input.siteId,
          email: input.email,
          phone: input.phone,
          dateOfJoining: input.dateOfJoining,
          department: input.department,
          employmentType: input.employmentType,
          compensation: input.compensation,
          status: 'pending',
          documents: input.documents,
          createdAt: new Date().toISOString(),
        }
        setState((prev) => ({ ...prev, staff: [...prev.staff, member] }))
        return member
      },

      setStaffStatus: (staffId, status) => {
        setState((prev) => ({
          ...prev,
          staff: prev.staff.map((s) => (s.id === staffId ? { ...s, status } : s)),
        }))
      },
```

- [ ] **Step 7: Run the type checker to confirm it passes**

Run: `npx tsc -b`
Expected: PASS (no output, exit code 0).

- [ ] **Step 8: Commit**

```bash
git add src/lib/types.ts src/lib/store.tsx
git commit -m "$(cat <<'EOF'
Add HR role and staff onboarding fields to the clinic store

Extends StaffMember with the fields HR onboarding needs (email, phone,
department, employment type, compensation, status, documents,
createdAt), migrates existing localStorage data defensively, seeds two
HR staff, and adds addStaffMember/setStaffStatus mutators — all on the
existing client-side store, no new persistence layer.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Default onboarding documents data

**Files:**
- Create: `src/data/onboardingDocuments.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `ONBOARDING_DOCUMENTS: Record<'doctor' | 'nurse' | 'receptionist', string[]>`, imported by Task 3.

- [ ] **Step 1: Create the file**

```ts
// Default document checklist HR is expected to collect per role. This is a
// checklist only (name + later a `received` toggle in the onboarding form)
// — the app has no file-upload/storage capability, so no actual files are
// stored anywhere.
export const ONBOARDING_DOCUMENTS: Record<'doctor' | 'nurse' | 'receptionist', string[]> = {
  doctor: [
    'Government ID proof (Aadhaar / PAN / Passport)',
    'Address proof',
    'Medical degree certificate (MBBS/MD or equivalent)',
    'Medical Council registration certificate',
    'Previous employment / experience certificate',
  ],
  nurse: [
    'Government ID proof (Aadhaar / PAN / Passport)',
    'Address proof',
    'Nursing diploma / degree certificate',
    'Nursing Council registration certificate',
    'Previous employment / experience certificate',
  ],
  receptionist: [
    'Government ID proof (Aadhaar / PAN / Passport)',
    'Address proof',
    'Educational certificate (highest qualification)',
    'Previous employment reference (if applicable)',
  ],
}
```

- [ ] **Step 2: Run the type checker**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/data/onboardingDocuments.ts
git commit -m "$(cat <<'EOF'
Add default onboarding document checklist per role

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Add Employee modal

**Files:**
- Create: `src/pages/hr/AddEmployeeModal.tsx`

**Interfaces:**
- Consumes: `useClinic().state.sites`, `useClinic().addStaffMember` (Task 1); `ONBOARDING_DOCUMENTS` (Task 2); `EmploymentType`, `OnboardingDocument` types (Task 1); UI components `Input`, `Label`, `Select` from `../../components/ui/Field`, `Button` from `../../components/ui/Button`, `MIcon` from `../../components/ui/MIcon`.
- Produces: `AddEmployeeModal({ onClose }: { onClose: () => void })`, a default-exportless named component consumed by Task 4 (`HRDashboard`).

- [ ] **Step 1: Create the file**

```tsx
import { useState } from 'react'
import { Input, Label, Select } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { MIcon } from '../../components/ui/MIcon'
import { useClinic } from '../../lib/store'
import { ONBOARDING_DOCUMENTS } from '../../data/onboardingDocuments'
import type { EmploymentType, OnboardingDocument } from '../../lib/types'

type OnboardableRole = 'doctor' | 'nurse' | 'receptionist'

const roleMeta: Record<
  OnboardableRole,
  { label: string; icon: string; departmentLabel: string; departmentPlaceholder: string }
> = {
  doctor: {
    label: 'Doctor',
    icon: 'stethoscope',
    departmentLabel: 'Department / Specialty',
    departmentPlaceholder: 'e.g. Cardiology',
  },
  nurse: {
    label: 'Nurse',
    icon: 'monitor_heart',
    departmentLabel: 'Department / Specialty',
    departmentPlaceholder: 'e.g. General Ward',
  },
  receptionist: {
    label: 'Receptionist',
    icon: 'person_add',
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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="glass w-full max-w-xl max-h-full overflow-y-auto rounded-2xl shadow-modal animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/60 px-6 py-4">
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
                className="glass-soft flex flex-col items-center gap-2 rounded-2xl p-5 transition-colors hover:bg-primary/5 hover:text-primary"
              >
                <MIcon name={roleMeta[r].icon} className="text-2xl" />
                <span className="font-body-md font-medium">{roleMeta[r].label}</span>
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
    </div>
  )
}
```

- [ ] **Step 2: Run the type checker**

Run: `npx tsc -b`
Expected: FAIL — `HRDashboard` doesn't exist yet, but that's Task 4; this file itself must compile with no errors of its own. If `tsc -b` reports errors specifically in `AddEmployeeModal.tsx`, fix them. Errors elsewhere (none expected at this point since nothing imports this file yet) are not this task's concern.

- [ ] **Step 3: Commit**

```bash
git add src/pages/hr/AddEmployeeModal.tsx
git commit -m "$(cat <<'EOF'
Add the Add Employee onboarding modal

Two-step modal (role select, then a shared form) built from the
existing Field/Button/MIcon components, submitting through the new
addStaffMember store method.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: HR Dashboard page

**Files:**
- Create: `src/pages/hr/HRDashboard.tsx`

**Interfaces:**
- Consumes: `useClinic().state` (`staff`, `sites`), `useClinic().setStaffStatus` (Task 1); `useActiveUser().site` (existing, from `src/lib/activeUser.tsx`); `AddEmployeeModal` (Task 3); UI components `PageHeader`, `Panel`, `Badge`, `Button`, `MIcon`.
- Produces: `HRDashboard()`, a page component consumed by Task 5 (`App.tsx` route).

- [ ] **Step 1: Create the file**

```tsx
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
```

- [ ] **Step 2: Run the type checker**

Run: `npx tsc -b`
Expected: FAIL only on `src/App.tsx` not yet routing to `HRDashboard` — that's fine, App.tsx isn't touched until Task 5, so this file's own compilation should show no errors from within `HRDashboard.tsx` itself. If it does, fix them before proceeding.

- [ ] **Step 3: Commit**

```bash
git add src/pages/hr/HRDashboard.tsx
git commit -m "$(cat <<'EOF'
Add the HR dashboard page

Stat tiles, a site-wise staff breakdown table, and a recent
employees/onboarding table with an inline Pending -> Active action,
all reading from the existing clinic store.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Wire the `hr` role into navigation, topbar, and routing

**Files:**
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/components/layout/Topbar.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `HRDashboard` (Task 4).
- Produces: nothing further downstream — this is the final wiring task.

- [ ] **Step 1: Update `src/components/layout/AppShell.tsx`**

Change `navByRole` and `portalLabel` to:

```ts
const navByRole: Record<StaffRole, NavItem[]> = {
  receptionist: [
    { to: '/reception/register', label: 'Register', icon: 'person_add' },
    { to: '/reception/queues', label: 'Queues', icon: 'format_list_bulleted' },
    { to: '/doctors', label: 'Doctors', icon: 'stethoscope' },
  ],
  nurse: [
    { to: '/nurse', label: 'Vitals', icon: 'monitor_heart' },
    { to: '/doctors', label: 'Doctors', icon: 'stethoscope' },
  ],
  doctor: [
    { to: '/doctor', label: 'My Room', icon: 'meeting_room' },
    { to: '/doctors', label: 'Doctors', icon: 'stethoscope' },
  ],
  hr: [{ to: '/hr', label: 'Dashboard', icon: 'dashboard' }],
}

const portalLabel: Record<StaffRole, string> = {
  receptionist: 'Reception',
  nurse: 'Nurse',
  doctor: 'Doctor',
  hr: 'HR',
}
```

- [ ] **Step 2: Update `src/components/layout/Topbar.tsx`**

Change `roleLabels` and `primaryAction` to:

```ts
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
```

- [ ] **Step 3: Update `src/App.tsx`**

Add the import:

```ts
import { HRDashboard } from './pages/hr/HRDashboard'
```

Add the route inside the existing `AppShell`-wrapped `<Routes>` block (alongside `/doctors`):

```tsx
                    <Route path="/hr" element={<HRDashboard />} />
```

- [ ] **Step 4: Run the type checker**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: same three pre-existing warnings as before this feature (`DaikoLogo.tsx` impure Math.random, `activeUser.tsx` and `store.tsx` fast-refresh warnings) — no new warnings or errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/AppShell.tsx src/components/layout/Topbar.tsx src/App.tsx
git commit -m "$(cat <<'EOF'
Wire the HR role into nav, topbar, and routing

Adds hr to the existing per-role nav/portal-label/primary-action
tables and routes /hr to the new HRDashboard, using the same
mechanism every other role already goes through.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Manual verification in the running app

**Files:** none (verification only).

- [ ] **Step 1: Start/confirm the dev server is running**

If not already running, start it (e.g. via the project's `dev` launch config) and open it in a browser.

- [ ] **Step 2: Switch to the HR role**

Open the topbar profile menu, change Role to "HR", confirm the "Signed in as" list shows Ananya Gupta / Vikram Nair, and confirm the sidebar now shows a single "Dashboard" item under an "HR" portal badge.

- [ ] **Step 3: Verify dashboard stats and breakdown**

Confirm the six stat tiles show: Total Doctors 3, Total Nurses 2, Total Receptionists 2, Total Staff 7, Active Staff 7, Pending Onboarding 0 (matching the seed data, excluding the 2 HR seed members). Confirm the site-wise table shows Site A (2 doctors, 1 nurse, 1 receptionist) and Site B (1 doctor, 1 nurse, 1 receptionist).

- [ ] **Step 4: Onboard a new Doctor**

Click "+ Add Employee", pick Doctor, fill every field (name, email, phone, date of joining, department/specialty, a site, employment type, compensation), leave the document checklist as-is, submit. Confirm the modal closes and the new doctor appears at the top of "Recent Employees / Onboarding" with a Pending badge, and that "Total Doctors" and "Total Staff" both incremented by 1, and "Pending Onboarding" incremented by 1.

- [ ] **Step 5: Mark the new employee Active**

Click "Mark Active" next to the new doctor. Confirm the badge switches to Active and "Active Staff"/"Pending Onboarding" counts update accordingly.

- [ ] **Step 6: Confirm the new employee is selectable like any other staff member**

Open the topbar profile menu, switch Role to Doctor, confirm the new doctor's name appears in "Signed in as" and can be selected (proving they're a first-class `StaffMember`, usable exactly like the seeded doctors).

- [ ] **Step 7: Confirm existing workflows are untouched**

Switch through Receptionist (Register + Queues), Nurse (Vitals), and Doctor (My Room) and confirm each still behaves as it did before this feature (register a patient, see it in queues, etc.) — no regressions.

- [ ] **Step 8: Final commit (only if Task 6 uncovered fixes)**

If any of the above steps required a code fix, commit it with an appropriate message. If everything passed as implemented, no commit is needed for this task.
