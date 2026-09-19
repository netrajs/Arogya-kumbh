import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ClinicProvider } from './lib/store'
import { ActiveUserProvider } from './lib/activeUser'
import { AppShell } from './components/layout/AppShell'
import { ReceptionRegister } from './pages/reception/ReceptionRegister'
import { ReceptionQueues } from './pages/reception/ReceptionQueues'
import { NurseVitals } from './pages/nurse/NurseVitals'
import { DoctorConsole } from './pages/doctor/DoctorConsole'
import { PrescriptionPrint } from './pages/doctor/PrescriptionPrint'
import { Doctors } from './pages/Doctors'
import { DisplayBoard } from './pages/DisplayBoard'
import { HRDashboard } from './pages/hr/HRDashboard'

export default function App() {
  return (
    <ClinicProvider>
      <ActiveUserProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/prescription/:visitId" element={<PrescriptionPrint />} />
            <Route path="/display" element={<DisplayBoard />} />
            <Route
              path="*"
              element={
                <AppShell>
                  <Routes>
                    <Route path="/" element={<Navigate to="/reception/register" replace />} />
                    <Route path="/reception/register" element={<ReceptionRegister />} />
                    <Route path="/reception/queues" element={<ReceptionQueues />} />
                    <Route path="/nurse" element={<NurseVitals />} />
                    <Route path="/doctor" element={<DoctorConsole />} />
                    <Route path="/doctors" element={<Doctors />} />
                    <Route path="/hr" element={<HRDashboard />} />
                  </Routes>
                </AppShell>
              }
            />
          </Routes>
        </BrowserRouter>
      </ActiveUserProvider>
    </ClinicProvider>
  )
}
