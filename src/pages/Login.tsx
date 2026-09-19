import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DaikoLockup } from '../components/ui/DaikoLogo'
import { Input, Label } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { MIcon } from '../components/ui/MIcon'
import { useAuth } from '../lib/AuthContext'
import { api, ApiError, type DevUser } from '../lib/apiClient'

const roleLabel: Record<DevUser['role'], string> = {
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  hr: 'HR',
}

export function Login() {
  const { sendOtp, verifyOtp, devSignIn, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [devUsers, setDevUsers] = useState<DevUser[] | null>(null)

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated, navigate, from])

  // Dev-only "quick sign in" picker. Compiled away in a production build
  // (import.meta.env.DEV is replaced with `false` at build time), and the
  // backend endpoint it calls doesn't exist outside dev mode either way.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    api
      .getDevUsers()
      .then(setDevUsers)
      .catch(() => setDevUsers([]))
  }, [])

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await sendOtp(email.trim())
      setStep('otp')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong sending the code.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!otp.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await verifyOtp(email.trim(), otp.trim())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong verifying the code.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDevSignIn(devEmail: string) {
    setSubmitting(true)
    setError('')
    try {
      await devSignIn(devEmail)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Local sign-in failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app-canvas flex min-h-screen flex-col items-center justify-center gap-8 p-6 font-body-md">
      <DaikoLockup markClassName="w-14 h-14" />

      <div className="card-surface w-full max-w-sm p-card-padding">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Sign in</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">Arogya Kumbh Clinic</p>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="mt-6 flex flex-col gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-meta text-error">{error}</p>}
            <Button type="submit" disabled={submitting || !email.trim()}>
              <MIcon name="mail" className="text-lg" /> Send code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-6 flex flex-col gap-4">
            <p className="text-body-md text-on-surface-variant">
              Enter the code sent to <span className="font-medium text-on-surface">{email}</span>
            </p>
            <div>
              <Label>Verification code</Label>
              <Input
                autoFocus
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
              />
            </div>
            {error && <p className="text-meta text-error">{error}</p>}
            <Button type="submit" disabled={submitting || !otp.trim()}>
              <MIcon name="check" className="text-lg" /> Verify &amp; sign in
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setOtp('')
                setError('')
              }}
              className="text-meta font-medium text-on-surface-variant hover:text-primary"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>

      {import.meta.env.DEV && devUsers && devUsers.length > 0 && (
        <div className="card-surface w-full max-w-sm p-card-padding">
          <p className="mb-3 font-label-caps text-label-caps uppercase text-on-surface-variant">
            Dev only · Quick sign in
          </p>
          <ul className="flex flex-col gap-2">
            {devUsers.map((u) => (
              <li key={u.email}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDevSignIn(u.email)}
                  className="glass-soft flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left transition-colors hover:bg-primary/5 hover:text-primary disabled:opacity-50"
                >
                  <span>
                    <span className="font-body-md font-medium text-on-surface">{u.name}</span>
                    <span className="ml-2 text-meta text-on-surface-variant">{u.email}</span>
                  </span>
                  <span className="text-meta font-semibold uppercase text-primary">{roleLabel[u.role]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
