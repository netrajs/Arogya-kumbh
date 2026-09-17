import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { Panel } from '../../components/ui/Panel'
import { Badge } from '../../components/ui/Badge'
import { MIcon } from '../../components/ui/MIcon'
import { Input, Label, Select, Textarea } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { useClinic } from '../../lib/store'
import { useActiveUser } from '../../lib/activeUser'
import type { PrescriptionItem, VisitStatus } from '../../lib/types'

const queueStatus: Record<VisitStatus, { tone: 'pending' | 'waiting' | 'active' | 'done'; label: string }> = {
  waiting_nurse: { tone: 'pending', label: 'With Nurse' },
  waiting_doctor: { tone: 'waiting', label: 'Ready for you' },
  in_consultation: { tone: 'active', label: 'In Consultation' },
  completed: { tone: 'done', label: 'Completed' },
}

export function DoctorConsole() {
  const { getPatient, getStaffName, getRoomQueue, roomsForSite, loginDoctor, logoutDoctor, startConsultation, saveConsultation } =
    useClinic()
  const { active, site } = useActiveUser()
  const navigate = useNavigate()

  const mySiteRooms = site ? roomsForSite(site.id) : []
  const myRoom = mySiteRooms.find((r) => r.currentDoctorId === active.staffId)
  const freeRooms = mySiteRooms.filter((r) => !r.currentDoctorId)
  const [pickedRoom, setPickedRoom] = useState('')

  const queue = myRoom ? getRoomQueue(myRoom.id).filter((v) => v.status !== 'completed') : []
  const current = queue.find((v) => v.status === 'in_consultation') ?? null
  // Everyone still in the room's queue, whichever stage they're at (with the
  // nurse, or ready for the doctor) — the doctor should see the whole queue,
  // not just the slice that's already cleared vitals.
  const roomQueue = queue.filter((v) => v.status !== 'in_consultation')
  const readyForDoctor = roomQueue.filter((v) => v.status === 'waiting_doctor')

  const [diagnosis, setDiagnosis] = useState('')
  const [items, setItems] = useState<Omit<PrescriptionItem, 'id'>[]>([{ medicineName: '', dosage: '' }])

  if (!myRoom) {
    return (
      <div className="flex flex-col w-full gap-gutter animate-fade-up">
        <PageHeader title="My Room" description={<>Daiko Clinic · {site?.name}</>} />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
          <Panel
            glyph="door_open"
            glyphClass="title-glyph title-glyph--blue"
            title="OPD rooms at this site"
            className="xl:col-span-5"
          >
            <ul className="space-y-2">
              {mySiteRooms.map((r) => (
                <li key={r.id} className="glass-soft rounded-2xl flex items-center justify-between px-4 py-2.5">
                  <span className="font-body-md font-medium text-on-surface">{r.name}</span>
                  {r.currentDoctorId ? (
                    <Badge tone="active">{getStaffName(r.currentDoctorId)}</Badge>
                  ) : (
                    <Badge tone="done">Available</Badge>
                  )}
                </li>
              ))}
              {mySiteRooms.length === 0 && (
                <p className="text-body-md text-on-surface-variant">No OPD rooms configured for this site.</p>
              )}
            </ul>
          </Panel>

          <Panel
            glyph="meeting_room"
            glyphClass="title-glyph title-glyph--indigo"
            title="Login to an OPD room"
            className="xl:col-span-7"
          >
            <p className="mb-4 text-body-md text-on-surface-variant">
              You're signed in to Daiko as <span className="font-medium text-primary">{getStaffName(active.staffId)}</span> at{' '}
              <span className="font-medium text-on-surface">{site?.name}</span>. Pick an available room to start seeing
              patients — its existing queue (if any) transfers to you automatically.
            </p>
            <Select value={pickedRoom} onChange={(e) => setPickedRoom(e.target.value)} className="mb-4">
              <option value="">Select a room</option>
              {freeRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
              {freeRooms.length === 0 && <option disabled>No free rooms right now</option>}
            </Select>
            <Button disabled={!pickedRoom} onClick={() => pickedRoom && loginDoctor(pickedRoom, active.staffId)}>
              <MIcon name="login" className="text-base" /> Login
            </Button>
          </Panel>
        </div>
      </div>
    )
  }

  function handleNextPatient() {
    if (readyForDoctor.length === 0) return
    startConsultation(readyForDoctor[0].id)
    setDiagnosis('')
    setItems([{ medicineName: '', dosage: '' }])
  }

  function handleSaveConsultation() {
    if (!current) return
    saveConsultation(current.id, {
      doctorId: active.staffId,
      diagnosis,
      items: items
        .filter((i) => i.medicineName.trim())
        .map((i, idx) => ({ id: `rx-${idx}-${crypto.randomUUID()}`, ...i })),
    })
    navigate(`/prescription/${current.id}`)
  }

  return (
    <div className="flex flex-col w-full gap-gutter animate-fade-up">
      <PageHeader title={myRoom.name} description={<>Daiko Clinic · {site?.name}</>} />

      {/* Room info strip: site / room / doctor / queue, per spec §1 */}
      <div className="liquid-glass rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <div>
            <p className="text-meta uppercase tracking-wide text-on-surface-variant">Site</p>
            <p className="font-semibold text-on-surface">{site?.name}</p>
          </div>
          <div>
            <p className="text-meta uppercase tracking-wide text-on-surface-variant">OPD Room</p>
            <p className="font-semibold text-on-surface">{myRoom.name}</p>
          </div>
          <div>
            <p className="text-meta uppercase tracking-wide text-on-surface-variant">Doctor</p>
            <p className="font-semibold text-primary">{getStaffName(active.staffId)}</p>
          </div>
          <div>
            <p className="text-meta uppercase tracking-wide text-on-surface-variant">Queue</p>
            <p className="font-semibold text-on-surface">
              {roomQueue.length} in queue{current ? ' · 1 in consultation' : ''}
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => logoutDoctor(myRoom.id)}>
          <MIcon name="logout" className="text-base" /> Logout of room
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
        <Panel
          glyph="groups"
          glyphClass="title-glyph title-glyph--blue"
          title={`Waiting Queue (${roomQueue.length})`}
          className="xl:col-span-4"
          action={
            <Button size="sm" onClick={handleNextPatient} disabled={readyForDoctor.length === 0 || !!current}>
              Next patient
            </Button>
          }
        >
          <ul className="space-y-2">
            {roomQueue.map((v) => {
              const patient = getPatient(v.patientId)
              return (
                <li key={v.id} className="glass-soft rounded-2xl px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-body-md font-medium text-on-surface">
                      #{v.tokenNumber} · {patient?.name}
                    </span>
                    <Badge tone={queueStatus[v.status].tone}>{queueStatus[v.status].label}</Badge>
                  </div>
                  <div className="text-meta text-on-surface-variant mt-0.5">
                    {patient?.age} yrs · {patient?.gender}
                  </div>
                  <div className="text-on-surface-variant">{v.ailmentSummary}</div>
                </li>
              )
            })}
            {roomQueue.length === 0 && !current && (
              <p className="text-body-md text-on-surface-variant">No patients in the queue.</p>
            )}
          </ul>
        </Panel>

        <Panel glyph="stethoscope" glyphClass="title-glyph title-glyph--indigo" title="Consultation" className="xl:col-span-8">
          {!current ? (
            <p className="text-body-md text-on-surface-variant">Click "Next patient" to start a consultation.</p>
          ) : (
            <>
              {(() => {
                const patient = getPatient(current.patientId)
                return (
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-headline-md text-headline-md text-on-surface">
                        {patient?.name} · Token #{current.tokenNumber}
                      </h3>
                      <p className="text-body-md text-on-surface-variant">
                        {patient?.age} yrs · {patient?.gender} · {current.ailmentSummary}
                      </p>
                    </div>
                    <Badge tone="active">In Consultation</Badge>
                  </div>
                )
              })()}

              <div className="liquid-glass mb-5 grid grid-cols-3 gap-3 rounded-2xl p-4 text-center">
                <div>
                  <p className="text-meta text-on-surface-variant">Weight</p>
                  <p className="font-semibold text-on-surface">{current.vitals?.weightKg ?? '—'} kg</p>
                </div>
                <div>
                  <p className="text-meta text-on-surface-variant">BP</p>
                  <p className="font-semibold text-on-surface">
                    {current.vitals ? `${current.vitals.bpSystolic}/${current.vitals.bpDiastolic}` : '—'} mmHg
                  </p>
                </div>
                <div>
                  <p className="text-meta text-on-surface-variant">Sugar</p>
                  <p className="font-semibold text-on-surface">{current.vitals?.bloodSugarMgdl ?? '—'} mg/dL</p>
                </div>
              </div>

              <Label>Diagnosis</Label>
              <Textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Viral fever" />

              <div className="mt-4">
                <Label>Prescription</Label>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        placeholder="Medicine name"
                        value={item.medicineName}
                        onChange={(e) => {
                          const next = [...items]
                          next[idx] = { ...next[idx], medicineName: e.target.value }
                          setItems(next)
                        }}
                      />
                      <Input
                        placeholder="Dosage e.g. 1-0-1"
                        value={item.dosage}
                        onChange={(e) => {
                          const next = [...items]
                          next[idx] = { ...next[idx], dosage: e.target.value }
                          setItems(next)
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-error hover:bg-error/10"
                      >
                        <MIcon name="delete" className="text-lg" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setItems([...items, { medicineName: '', dosage: '' }])}
                  className="mt-2 inline-flex items-center gap-1 font-body-md text-body-md font-medium text-primary hover:underline"
                >
                  <MIcon name="add" className="text-lg" /> Add medicine
                </button>
              </div>

              <Button className="mt-6" onClick={handleSaveConsultation} disabled={!diagnosis.trim()}>
                Save consultation &amp; generate prescription
              </Button>
            </>
          )}
        </Panel>
      </div>
    </div>
  )
}
