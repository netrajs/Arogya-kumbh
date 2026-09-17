import { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
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
  const [confirmation, setConfirmation] = useState<{ token: number; doctor: string } | null>(null)

  const myRooms = site ? roomsForSite(site.id) : []
  const availableRooms = myRooms.filter((r) => r.currentDoctorId)

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
    })
    setConfirmation({
      token: visit.tokenNumber,
      doctor: room?.currentDoctorId ? getStaffName(room.currentDoctorId) : '—',
    })
    setName('')
    setAge('')
    setAilment('')
    setRoomId('')
  }

  return (
    <div>
      <PageHeader title="Register Patient" description={<>Daiko Clinic · {site?.name}</>} />

      <div className="grid gap-gutter lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
              <Label>Assign doctor</Label>
              <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                <option value="">
                  {availableRooms.length ? 'Select an available doctor' : 'No doctor is currently logged in'}
                </option>
                {availableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {getStaffName(r.currentDoctorId!)} — {r.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="sm:col-span-2 mt-2">
              <Button type="submit" disabled={!canSubmit}>
                Generate token &amp; add to queue
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 font-headline-md text-headline-md text-on-surface">Available OPD</h2>
          <ul className="space-y-2">
            {myRooms.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-2.5 text-body-md"
              >
                <span className="font-medium text-on-surface">{r.name}</span>
                <span className={r.currentDoctorId ? 'text-primary' : 'text-on-surface-variant'}>
                  {r.currentDoctorId ? getStaffName(r.currentDoctorId) : 'No doctor logged in'}
                </span>
              </li>
            ))}
          </ul>

          {confirmation && (
            <div className="mt-5 rounded-xl bg-primary/10 p-4 text-center">
              <p className="font-label-caps text-label-caps uppercase text-primary">Token issued</p>
              <p className="mt-1 font-display-stat text-display-stat text-primary">#{confirmation.token}</p>
              <p className="mt-1 text-meta text-on-surface-variant">Assigned to {confirmation.doctor}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
