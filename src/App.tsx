import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ClinicProvider } from './lib/store'
import { AuthProvider } from './lib/AuthContext'
import { RequireAuth, RoleRoute, RoleRedirect } from './lib/routeGuards'
import { AppShell } from './components/layout/AppShell'
import { Login } from './pages/Login'
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
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public: OTP login. */}
          <Route path="/login" element={<Login />} />

          {/* Public: the waiting-room "now serving" screen - a kiosk
              display, not something staff sign in to use. */}
          <Route
            path="/display"
            element={
              <ClinicProvider>
                <DisplayBoard />
              </ClinicProvider>
            }
          />

          {/* Printable prescription - authenticated, but deliberately
              outside AppShell (no sidebar/topbar chrome on a print view). */}
          <Route
            path="/prescription/:visitId"
            element={
              <RequireAuth>
                <ClinicProvider>
                  <PrescriptionPrint />
                </ClinicProvider>
              </RequireAuth>
            }
          />

          {/* Everything else: authenticated, role-gated, inside AppShell. */}
          <Route
            path="*"
            element={
              <RequireAuth>
                <ClinicProvider>
                  <AppShell>
                    <Routes>
                      <Route path="/" element={<RoleRedirect />} />
                      <Route
                        path="/reception/register"
                        element={
                          <RoleRoute roles={['receptionist']}>
                            <ReceptionRegister />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/reception/queues"
                        element={
                          <RoleRoute roles={['receptionist']}>
                            <ReceptionQueues />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/nurse"
                        element={
                          <RoleRoute roles={['nurse']}>
                            <NurseVitals />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/doctor"
                        element={
                          <RoleRoute roles={['doctor']}>
                            <DoctorConsole />
                          </RoleRoute>
                        }
                      />
                      <Route path="/doctors" element={<Doctors />} />
                      <Route
                        path="/hr"
                        element={
                          <RoleRoute roles={['hr']}>
                            <HRDashboard />
                          </RoleRoute>
                        }
                      />
                    </Routes>
                  </AppShell>
                </ClinicProvider>
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
