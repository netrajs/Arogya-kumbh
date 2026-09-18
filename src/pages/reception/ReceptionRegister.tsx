import { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Panel } from '../../components/ui/Panel'
import { Badge } from '../../components/ui/Badge'
import { Input, Label, Select, Textarea } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { useClinic } from '../../lib/store'
import { useActiveUser } from '../../lib/activeUser'
import type { Gender } from '../../lib/types'

export function ReceptionRegister() {
  const { getStaffName, roomsForSite, registerPatient } = useClinic()
  const { active, site } = useActiveUser()

  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>('Male')
  const [age, setAge] = useState('')
  const [ailment, setAilment] = useState('')
  const [roomId, setRoomId] = useState('')
  const [isEmergency, setIsEmergency] = useState(false)
  const [confirmation, setConfirmation] = useState<{ token: number; room: string; doctor: string; isEmergency: boolean } | null>(
    null,
  )

  const myRooms = site ? roomsForSite(site.id) : []

  const canSubmit = name.trim() && age && ailment.trim() && roomId

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    const room = myRooms.find((r) => r.id === roomId)
    const visit = registerPatient({
      name: name.trim(),
      gender,
      age: Number(age),
      ailmentSummary: ailment.trim(),
      roomId,
      registeredBy: active.staffId,
      isEmergency,
    })
    setConfirmation({
      token: visit.tokenNumber,
      room: room?.name ?? '—',
      doctor: room?.currentDoctorId ? getStaffName(room.currentDoctorId) : 'Unattended — will be seen once a doctor logs in',
      isEmergency,
    })
    setName('')
    setAge('')
    setAilment('')
    setRoomId('')
    setIsEmergency(false)
  }

  return (
    <div className="flex flex-col w-full gap-gutter animate-fade-up">
      <PageHeader title="Register Patient" description={<>Daiko Clinic · {site?.name}</>} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
        <Panel glyph="person_add" glyphClass="title-glyph title-glyph--indigo" title="Patient details" className="xl:col-span-8">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Patient name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul Patil" />
            </div>

            <div>
              <Label>Gender</Label>
              <Select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </Select>
            </div>

            <div>
              <Label>Age</Label>
              <Input type="number" min={0} value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 42" />
            </div>

            <div className="sm:col-span-2">
              <Label>Ailment / complaint summary</Label>
              <Textarea value={ailment} onChange={(e) => setAilment(e.target.value)} placeholder="e.g. Fever and body ache" />
            </div>

            <div className="sm:col-span-2">
              <Label>Assign OPD room</Label>
              <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                <option value="">{myRooms.length ? 'Select a room' : 'No OPD rooms configured for this site'}</option>
                {myRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.currentDoctorId ? getStaffName(r.currentDoctorId) : 'Unattended (no doctor yet)'}
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 text-meta text-on-surface-variant">
                A room without a doctor yet is fine to pick — the patient will already be in the queue once one logs in.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2.5 rounded-control border border-outline-variant bg-surface-container-low px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="h-4 w-4 accent-error"
                />
                <span className="font-body-md text-body-md text-on-surface">Mark as emergency</span>
                <span className="text-meta text-on-surface-variant">— moves this patient to the front of the queue</span>
              </label>
            </div>

            <div className="sm:col-span-2 mt-2">
              <Button type="submit" variant={isEmergency ? 'danger' : 'primary'} disabled={!canSubmit}>
                Generate token &amp; add to queue
              </Button>
            </div>
          </form>
        </Panel>

        <Panel glyph="meeting_room" glyphClass="title-glyph title-glyph--blue" title="Available OPD" className="xl:col-span-4">
          <ul className="space-y-2">
            {myRooms.map((r) => (
              <li
                key={r.id}
                className="glass-soft rounded-2xl flex items-center justify-between px-4 py-2.5 text-body-md"
              >
                <span className="font-medium text-on-surface">{r.name}</span>
                <span className={r.currentDoctorId ? 'text-primary' : 'text-on-surface-variant'}>
                  {r.currentDoctorId ? getStaffName(r.currentDoctorId) : 'No doctor logged in'}
                </span>
              </li>
            ))}
          </ul>

          {confirmation && (
            <div className="liquid-glass mt-5 rounded-2xl p-4 text-center">
              {confirmation.isEmergency && (
                <div className="mb-2 flex justify-center">
                  <Badge tone="emergency">Emergency</Badge>
                </div>
              )}
              <p className="font-label-caps text-label-caps uppercase text-primary">Token issued</p>
              <p className="mt-1 font-display-stat text-display-stat text-primary">#{confirmation.token}</p>
              <p className="mt-1 text-meta text-on-surface-variant">
                {confirmation.room} · {confirmation.doctor}
              </p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
