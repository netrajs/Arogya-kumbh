import { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Panel } from '../../components/ui/Panel'
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
    <div className="flex flex-col w-full gap-gutter animate-fade-up">
      <PageHeader title="Initial Assessment" description={<>Daiko Clinic · {site?.name}</>} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
        <Panel
          glyph="groups"
          glyphClass="title-glyph title-glyph--blue"
          title={`Waiting for vitals (${queue.length})`}
          className="xl:col-span-4"
        >
          {queue.length === 0 && <p className="text-body-md text-on-surface-variant">No patients waiting.</p>}
          <ul className="space-y-2">
            {queue.map((v) => {
              const patient = getPatient(v.patientId)
              const isActive = selected?.id === v.id
              return (
                <li key={v.id}>
                  <button
                    onClick={() => setSelectedId(v.id)}
                    className={
                      'w-full rounded-2xl px-4 py-3 text-left transition ' +
                      (isActive ? 'bg-primary text-on-primary shadow-md' : 'glass-soft text-on-surface hover:bg-white/70')
                    }
                  >
                    <div className="font-body-md font-medium">
                      #{v.tokenNumber} · {patient?.name}
                    </div>
                    <div className={isActive ? 'text-white/80' : 'text-on-surface-variant'}>{v.ailmentSummary}</div>
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel glyph="monitor_heart" glyphClass="title-glyph title-glyph--indigo" title="Record vitals" className="xl:col-span-8">
          {!selected ? (
            <p className="text-body-md text-on-surface-variant">Select a patient from the list to record vitals.</p>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  {getPatient(selected.patientId)?.name} · Token #{selected.tokenNumber}
                </h3>
                <p className="text-body-md text-on-surface-variant">{selected.ailmentSummary}</p>
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
        </Panel>
      </div>
    </div>
  )
}
