export type StaffRole = 'receptionist' | 'nurse' | 'doctor'

export interface Site {
  id: string
  name: string
}

export interface StaffMember {
  id: string
  name: string
  role: StaffRole
  siteId: string
}

export interface Room {
  id: string
  siteId: string
  name: string
  currentDoctorId: string | null
}

export type Gender = 'Male' | 'Female' | 'Other'

export interface Patient {
  id: string
  siteId: string
  name: string
  gender: Gender
  age: number
}

export type VisitStatus =
  | 'waiting_nurse'
  | 'waiting_doctor'
  | 'in_consultation'
  | 'completed'

export interface Vitals {
  weightKg: number
  bpSystolic: number
  bpDiastolic: number
  bloodSugarMgdl: number
  recordedBy: string
  recordedAt: string
}

export interface PrescriptionItem {
  id: string
  medicineName: string
  dosage: string
}

export interface Consultation {
  doctorId: string
  diagnosis: string
  items: PrescriptionItem[]
  consultedAt: string
}

export interface Visit {
  id: string
  siteId: string
  tokenNumber: string
  patientId: string
  roomId: string
  ailmentSummary: string
  status: VisitStatus
  isEmergency: boolean
  registeredBy: string
  registeredAt: string
  vitals?: Vitals
  consultation?: Consultation
}
