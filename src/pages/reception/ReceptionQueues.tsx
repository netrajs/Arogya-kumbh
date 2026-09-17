import { PageHeader } from '../../components/ui/PageHeader'
import { Panel } from '../../components/ui/Panel'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Field'
import { useClinic } from '../../lib/store'
import { useActiveUser } from '../../lib/activeUser'
import type { Visit, VisitStatus } from '../../lib/types'

const statusBadge: Record<VisitStatus, { tone: 'pending' | 'waiting' | 'active' | 'done'; label: string }> = {
  waiting_nurse: { tone: 'pending', label: 'With Nurse' },
  waiting_doctor: { tone: 'waiting', label: 'Waiting for Doctor' },
  in_consultation: { tone: 'active', label: 'In Consultation' },
  completed: { tone: 'done', label: 'Completed' },
}

const glyphs = ['title-glyph title-glyph--indigo', 'title-glyph title-glyph--blue', 'title-glyph title-glyph--mint', 'title-glyph']

export function ReceptionQueues() {
  const { getPatient, getStaffName, getRoomQueue, roomsForSite, reassignVisit } = useClinic()
  const { site } = useActiveUser()

  const myRooms = site ? roomsForSite(site.id) : []

  return (
    <div className="flex flex-col w-full gap-gutter animate-fade-up">
      <PageHeader title="OPD Queues" description={<>Daiko Clinic · {site?.name}</>} />

      <div className="grid gap-gutter md:grid-cols-2 xl:grid-cols-3">
        {myRooms.map((room, idx) => {
          const queue = getRoomQueue(room.id)
          return (
            <Panel
              key={room.id}
              glyph="meeting_room"
              glyphClass={glyphs[idx % glyphs.length]}
              title={room.name}
              action={
                <span className={'text-meta font-medium ' + (room.currentDoctorId ? 'text-primary' : 'text-on-surface-variant')}>
                  {room.currentDoctorId ? getStaffName(room.currentDoctorId) : 'No doctor'}
                </span>
              }
            >
              {queue.length === 0 && <p className="text-body-md text-on-surface-variant">Queue is empty.</p>}

              <ul className="space-y-2">
                {queue.map((visit: Visit) => {
                  const patient = getPatient(visit.patientId)
                  const otherRooms = myRooms.filter((r) => r.id !== room.id && r.currentDoctorId)
                  return (
                    <li key={visit.id} className="glass-soft rounded-2xl p-3">
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
                            className="!py-1.5 !text-xs"
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
            </Panel>
          )
        })}
      </div>
    </div>
  )
}
