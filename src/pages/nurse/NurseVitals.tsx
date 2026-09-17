import { useState } from 'react'
import { Topbar } from '../../components/layout/Topbar'
import { GlassCard } from '../../components/ui/GlassCard'
import { Input, Label } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { useClinic } from '../../lib/store'
import { useActiveUser } from '../../lib/activeUser'

export function NurseVitals() {
  const { getPatient, getNurseQueue, recordVitals } = useClinic()
  const { active, site } = useActiveUser()

  const queue = site ? getNurseQueue(site.id) : []
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = queue.find((v) => v.id === selectedId) ?? queue[0] ?? null

  const [weight, setWeight] = useState('')
  const [sys, setSys] = useState('')
  const [dia, setDia] = useState('')
  const [sugar, setSugar] = useState('')

  const canSave = selected && weight && sys && dia && sugar

  function handleSave() {
    if (!selected || !canSave) return
    recordVitals(selected.id, {
      weightKg: Number(weight),
      bpSystolic: Number(sys),
      bpDiastolic: Number(dia),
      bloodSugarMgdl: Number(sugar),
      recordedBy: active.staffId,
    })
    setWeight('')
    setSys('')
    setDia('')
    setSugar('')
    setSelectedId(null)
  }

  return (
    <div>
      <Topbar title="Initial Assessment" />

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-5 lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold text-[#3a3454]">Waiting for vitals ({queue.length})</h2>
          {queue.length === 0 && <p className="text-sm text-[#9a93b3]">No patients waiting.</p>}
          <ul className="space-y-2">
            {queue.map((v) => {
              const patient = getPatient(v.patientId)
              const isActive = selected?.id === v.id
              return (
                <li key={v.id}>
                  <button
                    onClick={() => setSelectedId(v.id)}
                    className={
                      'w-full rounded-2xl px-4 py-3 text-left text-sm transition ' +
                      (isActive ? 'bg-brand-500 text-white shadow-md' : 'bg-white/55 text-[#241f3a] hover:bg-white/80')
                    }
                  >
                    <div className="font-medium">
                      #{v.tokenNumber} · {patient?.name}
                    </div>
                    <div className={isActive ? 'text-white/80' : 'text-[#9a93b3]'}>{v.ailmentSummary}</div>
                  </button>
                </li>
              )
            })}
          </ul>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          {!selected ? (
            <p className="text-sm text-[#9a93b3]">Select a patient from the list to record vitals.</p>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[#211c37]">
                  {getPatient(selected.patientId)?.name} · Token #{selected.tokenNumber}
                </h2>
                <p className="text-sm text-[#7a7396]">{selected.ailmentSummary}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Weight (kg)</Label>
                  <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="64" />
                </div>
                <div>
                  <Label>BP Systolic</Label>
                  <Input type="number" value={sys} onChange={(e) => setSys(e.target.value)} placeholder="120" />
                </div>
                <div>
                  <Label>BP Diastolic</Label>
                  <Input type="number" value={dia} onChange={(e) => setDia(e.target.value)} placeholder="80" />
                </div>
                <div>
                  <Label>Blood Sugar (mg/dL)</Label>
                  <Input type="number" value={sugar} onChange={(e) => setSugar(e.target.value)} placeholder="108" />
                </div>
              </div>

              <Button className="mt-5" onClick={handleSave} disabled={!canSave}>
                Save vitals
              </Button>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
