import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Patient, Room, Site, StaffMember, Visit, Vitals, Consultation } from './types'

const STORAGE_KEY = 'daiko-clinic-v2'

// Emergency patients always sort ahead of everyone else in a room/nurse
// queue; within the same priority, earlier tokens go first.
function byQueueOrder(a: Visit, b: Visit) {
  if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1
  return a.tokenNumber - b.tokenNumber
}

const seedSites: Site[] = [
  { id: 'site-a', name: 'Site A' },
  { id: 'site-b', name: 'Site B' },
]

const seedStaff: StaffMember[] = [
  { id: 'st-1', name: 'Sara Khan', role: 'receptionist', siteId: 'site-a' },
  { id: 'st-2', name: 'Priya Shah', role: 'nurse', siteId: 'site-a' },
  { id: 'st-3', name: 'Dr. Arjun Mehta', role: 'doctor', siteId: 'site-a' },
  { id: 'st-4', name: 'Dr. Kavita Rao', role: 'doctor', siteId: 'site-a' },
  { id: 'st-6', name: 'Neha Verma', role: 'receptionist', siteId: 'site-b' },
  { id: 'st-7', name: 'Rina Kapoor', role: 'nurse', siteId: 'site-b' },
  { id: 'st-5', name: 'Dr. Imran Sheikh', role: 'doctor', siteId: 'site-b' },
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
    sites: seedSites,
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
  getStaffName: (staffId: string) => string
  getStaffSite: (staffId: string) => Site | undefined
  roomsForSite: (siteId: string) => Room[]
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

      registerPatient: ({ name, gender, age, ailmentSummary, roomId, registeredBy, isEmergency = false }) => {
        const patientId = `pt-${crypto.randomUUID()}`
        const visitId = `vs-${crypto.randomUUID()}`
        let createdVisit: Visit | null = null

        setState((prev) => {
          const room = prev.rooms.find((r) => r.id === roomId)!
          const nextToken = (prev.tokenCounters[roomId] ?? 0) + 1
          const patient: Patient = { id: patientId, siteId: room.siteId, name, gender, age }
          const visit: Visit = {
            id: visitId,
            siteId: room.siteId,
            tokenNumber: nextToken,
            patientId,
            roomId,
            ailmentSummary,
            status: 'waiting_nurse',
            isEmergency,
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

      setEmergency: (visitId, isEmergency) => {
        setState((prev) => ({
          ...prev,
          visits: prev.visits.map((v) => (v.id === visitId ? { ...v, isEmergency } : v)),
        }))
      },

      // Move a chosen set of visits (anywhere from one patient to a whole
      // room's queue — the caller decides which) into another room,
      // re-issuing token numbers in the destination room's own sequence
      // (so they don't collide with whatever's already there), while
      // preserving the emergency-first / arrival order they had.
      moveVisits: (visitIds, toRoomId) => {
        setState((prev) => {
          const idSet = new Set(visitIds)
          const moving = prev.visits.filter((v) => idSet.has(v.id) && v.status !== 'completed').sort(byQueueOrder)
          if (moving.length === 0) return prev

          let counter = prev.tokenCounters[toRoomId] ?? 0
          const newTokenById = new Map(moving.map((v) => [v.id, ++counter]))

          return {
            ...prev,
            visits: prev.visits.map((v) =>
              newTokenById.has(v.id) ? { ...v, roomId: toRoomId, tokenNumber: newTokenById.get(v.id)! } : v,
            ),
            tokenCounters: { ...prev.tokenCounters, [toRoomId]: counter },
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
