import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Patient, Room, StaffMember, Visit, Vitals, Consultation } from './types'

const STORAGE_KEY = 'arogya-kumbh-clinic-v1'

const seedStaff: StaffMember[] = [
  { id: 'st-1', name: 'Sara Khan', role: 'receptionist' },
  { id: 'st-2', name: 'Priya Shah', role: 'nurse' },
  { id: 'st-3', name: 'Dr. Arjun Mehta', role: 'doctor' },
  { id: 'st-4', name: 'Dr. Kavita Rao', role: 'doctor' },
  { id: 'st-5', name: 'Dr. Imran Sheikh', role: 'doctor' },
]

const seedRooms: Room[] = [
  { id: 'room-1', name: 'Room 1', currentDoctorId: null },
  { id: 'room-2', name: 'Room 2', currentDoctorId: null },
  { id: 'room-3', name: 'Room 3', currentDoctorId: null },
]

interface ClinicState {
  siteName: string
  staff: StaffMember[]
  rooms: Room[]
  patients: Patient[]
  visits: Visit[]
  tokenCounters: Record<string, number>
}

function loadState(): ClinicState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ClinicState
  } catch {
    // ignore corrupt storage
  }
  return {
    siteName: 'Arogya Kumbh — Clinic Site 1',
    staff: seedStaff,
    rooms: seedRooms,
    patients: [],
    visits: [],
    tokenCounters: {},
  }
}

interface ClinicApi {
  state: ClinicState
  staff: StaffMember[]
  doctors: StaffMember[]
  nurses: StaffMember[]
  receptionists: StaffMember[]
  registerPatient: (input: {
    name: string
    gender: Patient['gender']
    age: number
    ailmentSummary: string
    roomId: string
    registeredBy: string
  }) => Visit
  reassignVisit: (visitId: string, newRoomId: string) => void
  loginDoctor: (roomId: string, doctorId: string) => void
  logoutDoctor: (roomId: string) => void
  recordVitals: (visitId: string, vitals: Omit<Vitals, 'recordedAt'>) => void
  startConsultation: (visitId: string) => void
  saveConsultation: (visitId: string, consultation: Omit<Consultation, 'consultedAt'>) => void
  getPatient: (patientId: string) => Patient | undefined
  getVisit: (visitId: string) => Visit | undefined
  getRoomQueue: (roomId: string) => Visit[]
  getNurseQueue: () => Visit[]
  getStaffName: (staffId: string) => string
}

const ClinicContext = createContext<ClinicApi | null>(null)

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClinicState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const api = useMemo<ClinicApi>(() => {
    const getStaffName = (staffId: string) =>
      state.staff.find((s) => s.id === staffId)?.name ?? 'Unknown'

    return {
      state,
      staff: state.staff,
      doctors: state.staff.filter((s) => s.role === 'doctor'),
      nurses: state.staff.filter((s) => s.role === 'nurse'),
      receptionists: state.staff.filter((s) => s.role === 'receptionist'),
      getStaffName,

      registerPatient: ({ name, gender, age, ailmentSummary, roomId, registeredBy }) => {
        const patientId = `pt-${crypto.randomUUID()}`
        const visitId = `vs-${crypto.randomUUID()}`
        let createdVisit: Visit | null = null

        setState((prev) => {
          const nextToken = (prev.tokenCounters[roomId] ?? 0) + 1
          const patient: Patient = { id: patientId, name, gender, age }
          const visit: Visit = {
            id: visitId,
            tokenNumber: nextToken,
            patientId,
            roomId,
            ailmentSummary,
            status: 'waiting_nurse',
            registeredBy,
            registeredAt: new Date().toISOString(),
          }
          createdVisit = visit
          return {
            ...prev,
            patients: [...prev.patients, patient],
            visits: [...prev.visits, visit],
            tokenCounters: { ...prev.tokenCounters, [roomId]: nextToken },
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
        state.visits
          .filter((v) => v.roomId === roomId && v.status !== 'completed')
          .sort((a, b) => a.tokenNumber - b.tokenNumber),

      getNurseQueue: () =>
        state.visits
          .filter((v) => v.status === 'waiting_nurse')
          .sort((a, b) => a.tokenNumber - b.tokenNumber),
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
