import { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Panel } from '../../components/ui/Panel'
import { Badge } from '../../components/ui/Badge'
import { MIcon } from '../../components/ui/MIcon'
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

export function ReceptionQueues() {
  const { getPatient, getStaffName, getRoomQueue, roomsForSite, reassignVisit, setEmergency } = useClinic()
  const { site } = useActiveUser()

  const myRooms = site ? roomsForSite(site.id) : []
  const [activeRoomId, setActiveRoomId] = useState('')
  const activeRoom = myRooms.find((r) => r.id === activeRoomId) ?? myRooms[0]
  const queue = activeRoom ? getRoomQueue(activeRoom.id) : []

  return (
    <div className="flex flex-col w-full gap-gutter animate-fade-up">
      <PageHeader title="OPD Queues" description={<>Daiko Clinic · {site?.name}</>} />

      <Panel
        glyph="meeting_room"
        glyphClass="title-glyph title-glyph--indigo"
        title="Rooms"
        action={
          activeRoom && (
            <span className={'text-meta font-medium ' + (activeRoom.currentDoctorId ? 'text-primary' : 'text-on-surface-variant')}>
              {activeRoom.currentDoctorId ? getStaffName(activeRoom.currentDoctorId) : 'Unattended'}
            </span>
          )
        }
      >
        {myRooms.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">No OPD rooms configured for this site.</p>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap gap-2 border-b border-outline-variant/60 pb-4">
              {myRooms.map((room) => {
                const roomQueueCount = getRoomQueue(room.id).length
                const isActive = room.id === activeRoom?.id
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setActiveRoomId(room.id)}
                    className={
                      'inline-flex items-center gap-2 rounded-full px-4 py-2 font-body-md text-body-md font-medium transition-colors ' +
                      (isActive
                        ? 'bg-primary text-on-primary shadow-[0_6px_18px_rgba(91,63,228,0.3)]'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface')
                    }
                  >
                    {room.name}
                    {roomQueueCount > 0 && (
                      <span
                        className={
                          'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold ' +
                          (isActive ? 'bg-white/25 text-on-primary' : 'bg-surface-container-highest text-on-surface-variant')
                        }
                      >
                        {roomQueueCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {queue.length === 0 && <p className="text-body-md text-on-surface-variant">Queue is empty.</p>}

            <ul className="space-y-2">
              {queue.map((visit: Visit) => {
                const patient = getPatient(visit.patientId)
                const otherRooms = myRooms.filter((r) => r.id !== activeRoom?.id)
                const canEscalate = visit.status !== 'completed' && visit.status !== 'in_consultation'
                return (
                  <li
                    key={visit.id}
                    className={'rounded-2xl p-3 ' + (visit.isEmergency ? 'bg-[#fee2e2]/60 ring-1 ring-[#ef4444]/40' : 'glass-soft')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-body-md text-body-md font-medium text-on-surface">
                        #{visit.tokenNumber} · {patient?.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {visit.isEmergency && <Badge tone="emergency">Emergency</Badge>}
                        <Badge tone={statusBadge[visit.status].tone}>{statusBadge[visit.status].label}</Badge>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {otherRooms.length > 0 && (
                        <Select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) reassignVisit(visit.id, e.target.value)
                          }}
                          className="!w-auto !py-1.5 !text-xs"
                        >
                          <option value="">Reassign to…</option>
                          {otherRooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} — {r.currentDoctorId ? getStaffName(r.currentDoctorId) : 'Unattended'}
                            </option>
                          ))}
                        </Select>
                      )}
                      {!visit.isEmergency && canEscalate && (
                        <button
                          type="button"
                          onClick={() => setEmergency(visit.id, true)}
                          className="inline-flex items-center gap-1 rounded-full border border-error/40 px-2.5 py-1 text-[11px] font-medium text-error hover:bg-error/8"
                        >
                          <MIcon name="emergency" className="text-sm" /> Mark emergency
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </Panel>
    </div>
  )
}
