import { Topbar } from '../../components/layout/Topbar'
import { GlassCard } from '../../components/ui/GlassCard'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Field'
import { useClinic } from '../../lib/store'
import type { Visit, VisitStatus } from '../../lib/types'

const statusBadge: Record<VisitStatus, { tone: 'ok' | 'warn' | 'idle' | 'info' | 'amber'; label: string }> = {
  waiting_nurse: { tone: 'amber', label: 'With Nurse' },
  waiting_doctor: { tone: 'info', label: 'Waiting for Doctor' },
  in_consultation: { tone: 'ok', label: 'In Consultation' },
  completed: { tone: 'idle', label: 'Completed' },
}

export function ReceptionQueues() {
  const { state, getPatient, getStaffName, getRoomQueue, reassignVisit } = useClinic()

  return (
    <div>
      <Topbar title="OPD Queues" subtitle={state.siteName} />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {state.rooms.map((room) => {
          const queue = getRoomQueue(room.id)
          return (
            <GlassCard key={room.id} className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-[#211c37]">{room.name}</h2>
                <span className={room.currentDoctorId ? 'text-sm text-ok-text' : 'text-sm text-idle-text'}>
                  {room.currentDoctorId ? getStaffName(room.currentDoctorId) : 'No doctor'}
                </span>
              </div>

              {queue.length === 0 && <p className="text-sm text-[#9a93b3]">Queue is empty.</p>}

              <ul className="space-y-2">
                {queue.map((visit: Visit) => {
                  const patient = getPatient(visit.patientId)
                  const otherRooms = state.rooms.filter((r) => r.id !== room.id && r.currentDoctorId)
                  return (
                    <li key={visit.id} className="rounded-2xl bg-white/55 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#241f3a]">
                          #{visit.tokenNumber} · {patient?.name}
                        </span>
                        <Badge tone={statusBadge[visit.status].tone}>{statusBadge[visit.status].label}</Badge>
                      </div>
                      {otherRooms.length > 0 && (
                        <div className="mt-2">
                          <Select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) reassignVisit(visit.id, e.target.value)
                            }}
                            className="!py-1.5 text-xs"
                          >
                            <option value="">Reassign to…</option>
                            {otherRooms.map((r) => (
                              <option key={r.id} value={r.id}>
                                {getStaffName(r.currentDoctorId!)} — {r.name}
                              </option>
                            ))}
                          </Select>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
