import { useParams, Link } from 'react-router-dom'
import { Printer, ArrowLeft } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { useClinic } from '../../lib/store'

export function PrescriptionPrint() {
  const { visitId } = useParams<{ visitId: string }>()
  const { getVisit, getPatient, getStaffName } = useClinic()

  const visit = visitId ? getVisit(visitId) : undefined
  const patient = visit ? getPatient(visit.patientId) : undefined

  if (!visit || !patient || !visit.consultation) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-sm text-[#7a7396]">Prescription not found.</p>
        <Link to="/doctor" className="text-brand-600">Back to My Room</Link>
      </div>
    )
  }

  const { consultation, vitals } = visit
  const consultedDate = new Date(consultation.consultedAt).toLocaleDateString('en-IN')

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link to="/doctor" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600">
          <ArrowLeft size={16} /> Back to My Room
        </Link>
        <Button onClick={() => window.print()}>
          <Printer size={16} /> Print prescription
        </Button>
      </div>

      <GlassCard className="bg-white/90 p-8 print:rounded-none print:border-none print:bg-white print:shadow-none">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-wide text-brand-700">AROGYA KUMBH</h1>
          <p className="text-sm tracking-widest text-[#7a7396]">CLINIC</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 text-sm">
          <p><span className="text-[#9a93b3]">Patient:</span> <span className="font-medium">{patient.name}</span></p>
          <p><span className="text-[#9a93b3]">Token:</span> <span className="font-medium">#{visit.tokenNumber}</span></p>
          <p><span className="text-[#9a93b3]">Age:</span> <span className="font-medium">{patient.age}</span></p>
          <p><span className="text-[#9a93b3]">Gender:</span> <span className="font-medium">{patient.gender}</span></p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3 rounded-2xl bg-white/60 p-4 text-center text-sm print:bg-transparent">
          <div>
            <p className="text-[#9a93b3]">Weight</p>
            <p className="font-semibold">{vitals?.weightKg ?? '—'} kg</p>
          </div>
          <div>
            <p className="text-[#9a93b3]">BP</p>
            <p className="font-semibold">
              {vitals ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : '—'} mmHg
            </p>
          </div>
          <div>
            <p className="text-[#9a93b3]">Sugar</p>
            <p className="font-semibold">{vitals?.bloodSugarMgdl ?? '—'} mg/dL</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9a93b3]">Diagnosis</p>
          <p className="mt-1 font-medium text-[#241f3a]">{consultation.diagnosis}</p>
        </div>

        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9a93b3]">Prescription</p>
          <ol className="space-y-1.5">
            {consultation.items.map((item, idx) => (
              <li key={item.id} className="flex justify-between border-b border-dashed border-[#e4dff5] pb-1.5 text-sm">
                <span>{idx + 1}. {item.medicineName}</span>
                <span className="font-medium">{item.dosage}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex justify-between text-sm text-[#7a7396]">
          <span>Doctor: {getStaffName(consultation.doctorId)}</span>
          <span>Date: {consultedDate}</span>
        </div>
      </GlassCard>
    </div>
  )
}
