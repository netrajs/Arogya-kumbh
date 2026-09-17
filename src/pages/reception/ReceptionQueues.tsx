import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Field'
import { useClinic } from '../../lib/store'
import { useActiveUser } from '../../lib/activeUser'
import type { Visit, VisitStatus } from '../../lib/types'

const statusBadge: Record<VisitStatus, { tone: 'pending' | 'info' | 'ok' | 'idle'; label: string }> = {
  waiting_nurse: { tone: 'pending', label: 'With Nurse' },
  waiting_doctor: { tone: 'info', label: 'Waiting for Doctor' },
  in_consultation: { tone: 'ok', label: 'In Consultation' },
  completed: { tone: 'idle', label: 'Completed' },
}

export function ReceptionQueues() {
  const { getPatient, getStaffName, getRoomQueue, roomsForSite, reassignVisit } = useClinic()
  const { site } = useActiveUser()

  const myRooms = site ? roomsForSite(site.id) : []

  return (
    <div>
      <PageHeader title="OPD Queues" description={<>Daiko Clinic · {site?.name}</>} />

      <div className="grid gap-gutter md:grid-cols-2 xl:grid-cols-3">
        {myRooms.map((room) => {
          const queue = getRoomQueue(room.id)
          return (
            <Card key={room.id}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-headline-md text-headline-md text-on-surface">{room.name}</h2>
                <span className={'text-meta font-meta ' + (room.currentDoctorId ? 'text-primary' : 'text-on-surface-variant')}>
                  {room.currentDoctorId ? getStaffName(room.currentDoctorId) : 'No doctor'}
                </span>
              </div>

              {queue.length === 0 && <p className="text-body-md text-on-surface-variant">Queue is empty.</p>}

              <ul className="space-y-2">
                {queue.map((visit: Visit) => {
                  const patient = getPatient(visit.patientId)
                  const otherRooms = myRooms.filter((r) => r.id !== room.id && r.currentDoctorId)
                  return (
                    <li key={visit.id} className="rounded-xl bg-surface-container-low p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-body-md text-body-md font-medium text-on-surface">
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
            </Card>
          )
        })}
      </div>
    </div>
  )
}
