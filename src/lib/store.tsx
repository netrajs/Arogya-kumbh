import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  Patient,
  Room,
  Site,
  StaffMember,
  Visit,
  Vitals,
  Consultation,
  EmploymentType,
  StaffStatus,
  OnboardingDocument,
} from './types'

const STORAGE_KEY = 'daiko-clinic-v2'

// Emergency patients always sort ahead of everyone else in a room/nurse
// queue; within the same priority, earlier registrations go first.
function byQueueOrder(a: Visit, b: Visit) {
  if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1
  return a.registeredAt.localeCompare(b.registeredAt)
}

// Token format: <month letter><time-slot letter>-<day of month>-<daily patient no>
// e.g. "ab-19-03" = January, 6am-12pm, the 19th, 3rd patient registered that day.
const MONTH_LETTERS = 'abcdefghijkl' // a=Jan ... l=Dec

function dateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function timeSlotLetter(date: Date) {
  const hour = date.getHours()
  if (hour < 6) return 'a'
  if (hour < 12) return 'b'
  if (hour < 18) return 'c'
  return 'd'
}

function formatToken(date: Date, dailySeq: number) {
  const monthLetter = MONTH_LETTERS[date.getMonth()]
  const timeLetter = timeSlotLetter(date)
  const day = String(date.getDate()).padStart(2, '0')
  const patientNo = String(dailySeq).padStart(2, '0')
  return `${monthLetter}${timeLetter}-${day}-${patientNo}`
}

const seedSites: Site[] = [
  { id: 'site-a', name: 'Site A' },
  { id: 'site-b', name: 'Site B' },
]

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

const seedRooms: Room[] = [
  { id: 'room-a1', siteId: 'site-a', name: 'Room 1', currentDoctorId: null },
  { id: 'room-a2', siteId: 'site-a', name: 'Room 2', currentDoctorId: null },
  { id: 'room-b1', siteId: 'site-b', name: 'Room 1', currentDoctorId: null },
  { id: 'room-b2', siteId: 'site-b', name: 'Room 2', currentDoctorId: null },
]

interface ClinicState {
  sites: Site[]
  staff: StaffMember[]
  rooms: Room[]
  patients: Patient[]
  visits: Visit[]
  // Keyed by calendar day ("YYYY-MM-DD"), shared across the whole clinic
  // so every token issued on a given day is unique.
  dailyTokenCounters: Record<string, number>
}

// Shape of whatever might already be sitting in a user's localStorage —
// staff records from before the onboarding fields existed only guarantee
// id/name/role/siteId, everything else may be missing.
interface RawClinicState extends Omit<ClinicState, 'staff'> {
  staff: (Pick<StaffMember, 'id' | 'name' | 'role' | 'siteId'> & Partial<StaffMember>)[]
}

function loadState(): ClinicState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as RawClinicState
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

interface ClinicApi {
  state: ClinicState
  staff: StaffMember[]
  doctors: StaffMember[]
  nurses: StaffMember[]
  receptionists: StaffMember[]
  getStaffName: (staffId: string) => string
  getStaffSite: (staffId: string) => Site | undefined
  roomsForSite: (siteId: string) => Room[]
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
  registerPatient: (input: {
    name: string
    gender: Patient['gender']
    age: number
    ailmentSummary: string
    roomId: string
    registeredBy: string
    isEmergency?: boolean
  }) => Visit
  reassignVisit: (visitId: string, newRoomId: string) => void
  moveVisits: (visitIds: string[], toRoomId: string) => void
  setEmergency: (visitId: string, isEmergency: boolean) => void
  loginDoctor: (roomId: string, doctorId: string) => void
  logoutDoctor: (roomId: string) => void
  recordVitals: (visitId: string, vitals: Omit<Vitals, 'recordedAt'>) => void
  startConsultation: (visitId: string) => void
  saveConsultation: (visitId: string, consultation: Omit<Consultation, 'consultedAt'>) => void
  getPatient: (patientId: string) => Patient | undefined
  getVisit: (visitId: string) => Visit | undefined
  getRoomQueue: (roomId: string) => Visit[]
  getNurseQueue: (siteId: string) => Visit[]
}

const ClinicContext = createContext<ClinicApi | null>(null)

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClinicState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // A queue-display screen is meant to sit in its own browser tab and just
  // watch — pick up whatever reception/nurse/doctor do in their own tabs
  // without needing a manual refresh.
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        setState(JSON.parse(e.newValue) as ClinicState)
      } catch {
        // ignore corrupt payloads from another tab mid-write
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const api = useMemo<ClinicApi>(() => {
    const getStaffName = (staffId: string) =>
      state.staff.find((s) => s.id === staffId)?.name ?? 'Unknown'

    const getStaffSite = (staffId: string) => {
      const member = state.staff.find((s) => s.id === staffId)
      return state.sites.find((s) => s.id === member?.siteId)
    }

    return {
      state,
      staff: state.staff,
      doctors: state.staff.filter((s) => s.role === 'doctor'),
      nurses: state.staff.filter((s) => s.role === 'nurse'),
      receptionists: state.staff.filter((s) => s.role === 'receptionist'),
      getStaffName,
      getStaffSite,
      roomsForSite: (siteId) => state.rooms.filter((r) => r.siteId === siteId),

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

      registerPatient: ({ name, gender, age, ailmentSummary, roomId, registeredBy, isEmergency = false }) => {
        const patientId = `pt-${crypto.randomUUID()}`
        const visitId = `vs-${crypto.randomUUID()}`
        let createdVisit: Visit | null = null

        setState((prev) => {
          const room = prev.rooms.find((r) => r.id === roomId)!
          const now = new Date()
          const key = dateKey(now)
          const nextSeq = (prev.dailyTokenCounters[key] ?? 0) + 1
          const patient: Patient = { id: patientId, siteId: room.siteId, name, gender, age }
          const visit: Visit = {
            id: visitId,
            siteId: room.siteId,
            tokenNumber: formatToken(now, nextSeq),
            patientId,
            roomId,
            ailmentSummary,
            status: 'waiting_nurse',
            isEmergency,
            registeredBy,
            registeredAt: now.toISOString(),
          }
          createdVisit = visit
          return {
            ...prev,
            patients: [...prev.patients, patient],
            visits: [...prev.visits, visit],
            dailyTokenCounters: { ...prev.dailyTokenCounters, [key]: nextSeq },
          }
        })

        return createdVisit as unknown as Visit
      },

      reassignVisit: (visitId, newRoomId) => {
        setState((prev) => ({
          ...prev,
          visits: prev.visits.map((v) => (v.id === visitId ? { ...v, roomId: newRoomId } : v)),
        }))
      },

      setEmergency: (visitId, isEmergency) => {
        setState((prev) => ({
          ...prev,
          visits: prev.visits.map((v) => (v.id === visitId ? { ...v, isEmergency } : v)),
        }))
      },

      // Move a chosen set of visits (anywhere from one patient to a whole
      // room's queue — the caller decides which) into another room. The
      // patient keeps the token they were issued at registration.
      moveVisits: (visitIds, toRoomId) => {
        setState((prev) => {
          const idSet = new Set(visitIds)
          return {
            ...prev,
            visits: prev.visits.map((v) =>
              idSet.has(v.id) && v.status !== 'completed' ? { ...v, roomId: toRoomId } : v,
            ),
          }
        })
      },

      loginDoctor: (roomId, doctorId) => {
        setState((prev) => ({
          ...prev,
          rooms: prev.rooms.map((r) => (r.id === roomId ? { ...r, currentDoctorId: doctorId } : r)),
        }))
      },

      logoutDoctor: (roomId) => {
        setState((prev) => ({
          ...prev,
          rooms: prev.rooms.map((r) => (r.id === roomId ? { ...r, currentDoctorId: null } : r)),
        }))
      },

      recordVitals: (visitId, vitals) => {
        setState((prev) => ({
          ...prev,
          visits: prev.visits.map((v) =>
            v.id === visitId
              ? {
                  ...v,
                  status: 'waiting_doctor',
                  vitals: { ...vitals, recordedAt: new Date().toISOString() },
                }
              : v,
          ),
        }))
      },

      startConsultation: (visitId) => {
        setState((prev) => ({
          ...prev,
          visits: prev.visits.map((v) => (v.id === visitId ? { ...v, status: 'in_consultation' } : v)),
        }))
      },

      saveConsultation: (visitId, consultation) => {
        setState((prev) => ({
          ...prev,
          visits: prev.visits.map((v) =>
            v.id === visitId
              ? {
                  ...v,
                  status: 'completed',
                  consultation: { ...consultation, consultedAt: new Date().toISOString() },
                }
              : v,
          ),
        }))
      },

      getPatient: (patientId) => state.patients.find((p) => p.id === patientId),
      getVisit: (visitId) => state.visits.find((v) => v.id === visitId),

      getRoomQueue: (roomId) =>
        state.visits.filter((v) => v.roomId === roomId && v.status !== 'completed').sort(byQueueOrder),

      getNurseQueue: (siteId) =>
        state.visits.filter((v) => v.siteId === siteId && v.status === 'waiting_nurse').sort(byQueueOrder),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return <ClinicContext.Provider value={api}>{children}</ClinicContext.Provider>
}

export function useClinic() {
  const ctx = useContext(ClinicContext)
  if (!ctx) throw new Error('useClinic must be used within ClinicProvider')
  return ctx
}
