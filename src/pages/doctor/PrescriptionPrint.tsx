import { useParams, Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { MIcon } from '../../components/ui/MIcon'
import { useClinic } from '../../lib/store'

export function PrescriptionPrint() {
  const { visitId } = useParams<{ visitId: string }>()
  const { getVisit, getPatient, getStaffName } = useClinic()

  const visit = visitId ? getVisit(visitId) : undefined
  const patient = visit ? getPatient(visit.patientId) : undefined

  if (!visit || !patient || !visit.consultation) {
    return (
      <div className="mx-auto max-w-2xl p-8 font-body-md">
        <p className="text-body-md text-on-surface-variant">Prescription not found.</p>
        <Link to="/doctor" className="text-primary">Back to My Room</Link>
      </div>
    )
  }

  const { consultation, vitals } = visit
  const consultedDate = new Date(consultation.consultedAt).toLocaleDateString('en-IN')

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-surface p-4 font-body-md sm:p-8">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link to="/doctor" className="inline-flex items-center gap-1 font-body-md text-body-md font-medium text-primary">
          <MIcon name="arrow_back" className="text-base" /> Back to My Room
        </Link>
        <Button onClick={() => window.print()}>
          <MIcon name="print" className="text-base" /> Print prescription
        </Button>
      </div>

      <Card className="print:rounded-none print:border-none print:shadow-none">
        <div className="mb-6 text-center">
          <h1 className="font-headline-lg text-2xl font-bold tracking-wide text-primary">AROGYA KUMBH</h1>
          <p className="font-meta text-meta tracking-widest text-on-surface-variant">CLINIC</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 text-body-md">
          <p><span className="text-on-surface-variant">Patient:</span> <span className="font-medium">{patient.name}</span></p>
          <p><span className="text-on-surface-variant">Token:</span> <span className="font-medium">#{visit.tokenNumber}</span></p>
          <p><span className="text-on-surface-variant">Age:</span> <span className="font-medium">{patient.age}</span></p>
          <p><span className="text-on-surface-variant">Gender:</span> <span className="font-medium">{patient.gender}</span></p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3 rounded-xl bg-surface-container-low p-4 text-center print:bg-transparent">
          <div>
            <p className="text-meta text-on-surface-variant">Weight</p>
            <p className="font-semibold text-on-surface">{vitals?.weightKg ?? '—'} kg</p>
          </div>
          <div>
            <p className="text-meta text-on-surface-variant">BP</p>
            <p className="font-semibold text-on-surface">
              {vitals ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : '—'} mmHg
            </p>
          </div>
          <div>
            <p className="text-meta text-on-surface-variant">Sugar</p>
            <p className="font-semibold text-on-surface">{vitals?.bloodSugarMgdl ?? '—'} mg/dL</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">Diagnosis</p>
          <p className="mt-1 font-medium text-on-surface">{consultation.diagnosis}</p>
        </div>

        <div className="mb-8">
          <p className="mb-2 font-label-caps text-label-caps uppercase text-on-surface-variant">Prescription</p>
          <ol className="space-y-1.5">
            {consultation.items.map((item, idx) => (
              <li
                key={item.id}
                className="flex justify-between border-b border-dashed border-outline-variant pb-1.5 text-body-md"
              >
                <span>{idx + 1}. {item.medicineName}</span>
                <span className="font-medium">{item.dosage}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex justify-between text-body-md text-on-surface-variant">
          <span>Doctor: {getStaffName(consultation.doctorId)}</span>
          <span>Date: {consultedDate}</span>
        </div>
      </Card>
    </div>
  )
}
