import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, LogIn, LogOut } from 'lucide-react'
import { Topbar } from '../../components/layout/Topbar'
import { GlassCard } from '../../components/ui/GlassCard'
import { Badge } from '../../components/ui/Badge'
import { Input, Label, Select, Textarea } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { useClinic } from '../../lib/store'
import { useActiveUser } from '../../lib/activeUser'
import type { PrescriptionItem } from '../../lib/types'

export function DoctorConsole() {
  const { state, getPatient, getStaffName, getRoomQueue, loginDoctor, logoutDoctor, startConsultation, saveConsultation } =
    useClinic()
  const { active } = useActiveUser()
  const navigate = useNavigate()

  const myRoom = state.rooms.find((r) => r.currentDoctorId === active.staffId)
  const freeRooms = state.rooms.filter((r) => !r.currentDoctorId)
  const [pickedRoom, setPickedRoom] = useState('')

  const queue = myRoom ? getRoomQueue(myRoom.id).filter((v) => v.status !== 'completed') : []
  const waiting = queue.filter((v) => v.status === 'waiting_doctor')
  const current = queue.find((v) => v.status === 'in_consultation') ?? null

  const [diagnosis, setDiagnosis] = useState('')
  const [items, setItems] = useState<Omit<PrescriptionItem, 'id'>[]>([{ medicineName: '', dosage: '' }])

  if (!myRoom) {
    return (
      <div>
        <Topbar title="My Room" subtitle={state.siteName} />
        <GlassCard className="max-w-md p-6">
          <h2 className="mb-1 font-semibold text-[#211c37]">Login to an OPD room</h2>
          <p className="mb-4 text-sm text-[#7a7396]">
            Pick a free room. Its existing queue (if any) will transfer to you automatically.
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
          <Button
            disabled={!pickedRoom}
            onClick={() => pickedRoom && loginDoctor(pickedRoom, active.staffId)}
          >
            <LogIn size={16} /> Login
          </Button>
        </GlassCard>
      </div>
    )
  }

  function handleNextPatient() {
    if (waiting.length === 0) return
    startConsultation(waiting[0].id)
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
    <div>
      <Topbar title={myRoom.name} subtitle={state.siteName} />

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-[#7a7396]">
          Logged in as <span className="font-semibold text-brand-700">{getStaffName(active.staffId)}</span>
        </p>
        <Button variant="secondary" onClick={() => logoutDoctor(myRoom.id)}>
          <LogOut size={16} /> Logout of room
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-5 lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#3a3454]">Waiting ({waiting.length})</h2>
            <Button onClick={handleNextPatient} disabled={waiting.length === 0 || !!current}>
              Next patient
            </Button>
          </div>
          <ul className="space-y-2">
            {waiting.map((v) => (
              <li key={v.id} className="rounded-2xl bg-white/55 px-4 py-2.5 text-sm">
                <div className="font-medium text-[#241f3a]">
                  #{v.tokenNumber} · {getPatient(v.patientId)?.name}
                </div>
                <div className="text-[#9a93b3]">{v.ailmentSummary}</div>
              </li>
            ))}
            {waiting.length === 0 && !current && (
              <p className="text-sm text-[#9a93b3]">No patients waiting.</p>
            )}
          </ul>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          {!current ? (
            <p className="text-sm text-[#9a93b3]">Click "Next patient" to start a consultation.</p>
          ) : (
            <>
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#211c37]">
                    {getPatient(current.patientId)?.name} · Token #{current.tokenNumber}
                  </h2>
                  <p className="text-sm text-[#7a7396]">{current.ailmentSummary}</p>
                </div>
                <Badge tone="ok">In Consultation</Badge>
              </div>

              <div className="mb-5 grid grid-cols-3 gap-3 rounded-2xl bg-white/50 p-4 text-center text-sm">
                <div>
                  <p className="text-[#9a93b3]">Weight</p>
                  <p className="font-semibold text-[#241f3a]">{current.vitals?.weightKg ?? '—'} kg</p>
                </div>
                <div>
                  <p className="text-[#9a93b3]">BP</p>
                  <p className="font-semibold text-[#241f3a]">
                    {current.vitals ? `${current.vitals.bpSystolic}/${current.vitals.bpDiastolic}` : '—'} mmHg
                  </p>
                </div>
                <div>
                  <p className="text-[#9a93b3]">Sugar</p>
                  <p className="font-semibold text-[#241f3a]">{current.vitals?.bloodSugarMgdl ?? '—'} mg/dL</p>
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
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setItems([...items, { medicineName: '', dosage: '' }])}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  <Plus size={16} /> Add medicine
                </button>
              </div>

              <Button className="mt-6" onClick={handleSaveConsultation} disabled={!diagnosis.trim()}>
                Save consultation &amp; generate prescription
              </Button>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
