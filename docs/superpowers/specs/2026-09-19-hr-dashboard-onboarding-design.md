# HR Dashboard & Employee Onboarding — Design

## Context

Arogya Kumbh (Daiko Clinic) is a client-only React + TypeScript + Vite app.
There is no backend, no real database, and no real authentication today:

- All app state (sites, staff, patients, visits) lives in one React context
  (`ClinicProvider` in `src/lib/store.tsx`), persisted to `localStorage`
  under the key `daiko-clinic-v2`, and synced across browser tabs via the
  `storage` event.
- "Signing in" is a demo switcher in the topbar (`Topbar.tsx`) that lets the
  user pick any role and any staff member for that role — there are no
  passwords or sessions.
- Roles today: `receptionist`, `nurse`, `doctor`. Each role has its own nav
  items (`AppShell.tsx`) and its own page(s) under `src/pages/<role>/`.

This feature adds a fourth role, `hr`, with a dashboard for staff insights
and an "Add Employee" onboarding flow, built entirely on top of the
existing store/role/routing patterns — no new infrastructure.

## Goals

- HR can see clinic-wide staff counts, a per-site breakdown, and a list of
  recently onboarded employees.
- HR can onboard a new Doctor, Nurse, or Receptionist through a guided
  form, which is saved into the same store patients/visits already use.
- The new employee immediately shows up in the dashboard counts/list and
  can then be selected in the existing demo sign-in switcher.
- No existing Reception/Nurse/Doctor workflow changes.

## Data model changes (`src/lib/types.ts`)

```ts
export type StaffRole = 'receptionist' | 'nurse' | 'doctor' | 'hr'

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern'

export type StaffStatus = 'pending' | 'active'

export interface OnboardingDocument {
  name: string
  received: boolean
}

export interface StaffMember {
  id: string
  name: string
  role: StaffRole
  siteId: string
  email: string
  phone: string
  dateOfJoining: string // ISO date (yyyy-mm-dd)
  department: string // "Department / Specialty" for doctor+nurse, "Department / Role" for receptionist
  employmentType: EmploymentType
  compensation: number // monthly, plain number (₹)
  status: StaffStatus
  documents: OnboardingDocument[]
  createdAt: string // ISO timestamp, used to sort "recent employees"
}
```

`StaffMember` fields beyond `id/name/role/siteId` are new and required.
Existing seed data and anything already in a user's `localStorage` predates
these fields, so `loadState()` in `store.tsx` backfills any staff record
missing them (same defensive-migration approach already used for
`dailyTokenCounters`): `status: 'active'`, `documents: []`,
`employmentType: 'full_time'`, `compensation: 0`, `dateOfJoining: ''`,
`department: ''`, `email: ''`, `phone: ''`, `createdAt: <fixed epoch>`.

Two HR seed staff are added (one per site) so the demo sign-in switcher has
someone to select under the HR role immediately, matching how doctors/
nurses/receptionists are already seeded.

## Store changes (`src/lib/store.tsx`)

New `ClinicApi` methods:

- `addStaffMember(input): StaffMember` — input covers everything above
  except `id`/`status`/`createdAt` (role restricted to
  `'doctor' | 'nurse' | 'receptionist'`, HR does not onboard more HR through
  this flow). Creates a new `StaffMember` with `status: 'pending'`,
  `createdAt: new Date().toISOString()`, appends to `state.staff`. Persists
  through the existing `useEffect` → `localStorage.setItem`.
- `setStaffStatus(staffId, status): void` — updates one staff member's
  status (used for the manual Pending → Active flip).

No changes to `registerPatient`, `moveVisits`, or any visit/queue logic.

## Default onboarding documents (`src/data/onboardingDocuments.ts`)

A `Record<'doctor' | 'nurse' | 'receptionist', string[]>` of the documents
HR is expected to collect per role (e.g. ID proof, address proof,
role-specific certification/registration). Used to pre-populate the
checklist in the onboarding form; HR can still toggle each Received/Pending
before or after submit — the checklist doesn't block submission.

## HR Dashboard (`src/pages/hr/HRDashboard.tsx`)

Reuses existing `PageHeader`, `Panel`, `Badge`, `Avatar`, `Button` UI
components and the `card-surface`/`glass-soft` styling already in use
elsewhere (e.g. `Doctors.tsx`, `DoctorConsole.tsx`).

- **Stat tiles**: Total Doctors, Total Nurses, Total Receptionists, Total
  Staff, Active Staff, Pending Onboarding. Computed by filtering
  `state.staff` to `role !== 'hr'` (HR isn't counted as clinical/ops
  staff), clinic-wide (not filtered to the signed-in HR's own site).
- **Site-wise breakdown table**: one row per `state.sites` entry, with
  doctor/nurse/receptionist headcounts at that site (both pending and
  active staff counted — a headcount view).
- **Recent Employees table**: staff sorted by `createdAt` descending
  (excluding `hr` role), showing Name, Role, Site, Date of Joining, and a
  Status badge (Pending/Active — reusing the existing `Badge` tone
  pattern). Includes a lightweight action to flip Pending → Active
  (`setStaffStatus`) inline.
- **"+ Add Employee"** button, prominent in the page header area, opens
  the onboarding modal.

No charts — per the brief, stat tiles + two tables only.

## Add Employee flow (`src/pages/hr/AddEmployeeModal.tsx`)

A two-step modal/dialog (styled consistent with the app's existing
`glass`/`shadow-modal` panels, e.g. the profile menu in `Topbar.tsx`):

1. **Role select** — Doctor / Nurse / Receptionist, as three clickable
   cards/buttons.
2. **Onboarding form** — one shared form component parameterized by the
   chosen role (only the department label and default document checklist
   differ by role; every other field is identical per the brief):
   - Full Name, Email, Phone Number, Date of Joining, Department/
     Specialty (or /Role for receptionist), Clinic/Site (`<Select>` of
     `state.sites`), Employment Type (`<Select>`), Salary/Compensation
     (number input), and the document checklist (checkboxes, pre-filled
     from `onboardingDocuments.ts`, editable).
   - Submit calls `addStaffMember`, closes the modal; the new employee is
     immediately visible in the dashboard (status: Pending) because it's
     the same reactive store everything else uses.

## Nav & routing

- `AppShell.tsx`: `navByRole.hr = [{ to: '/hr', label: 'Dashboard', icon:
  'dashboard' }]`, `portalLabel.hr = 'HR'`.
- `Topbar.tsx`: `roleLabels.hr = 'HR'`, `primaryAction.hr = { label: 'HR
  Dashboard', to: '/hr', icon: 'badge' }`.
- `App.tsx`: `<Route path="/hr" element={<HRDashboard />} />` inside the
  existing `AppShell`-wrapped route group.
- **Access control**: consistent with how every other role is scoped
  today (nav-visibility only, no hard route guard anywhere in the app),
  `/hr` is simply not linked/visible outside the HR role. No new
  "protected route" mechanism is introduced, since none exists elsewhere
  in the app to be consistent with.

## Out of scope (explicitly, per earlier discussion)

- No real backend/database/server.
- No real authentication/SSO/passwords/sessions.
- No real file upload/storage for onboarding documents (checklist only).
- No changes to Reception/Nurse/Doctor/queue/prescription workflows.

## Testing

- `npx tsc -b` must pass.
- `npm run lint` must show no new warnings/errors.
- Manual verification in the browser: switch to HR role, view dashboard
  counts/breakdown, onboard a Doctor/Nurse/Receptionist through the modal,
  confirm the new employee appears in Recent Employees with Pending
  status, flip to Active, confirm counts update, confirm the new staff
  member appears in the "Signed in as" switcher under their role, and
  confirm existing Reception/Nurse/Doctor pages are unaffected.
