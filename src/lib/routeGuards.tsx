import { Navigate, useLocation, type Location } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import type { StaffRole } from './types'

export function roleHome(role: StaffRole): string {
  switch (role) {
    case 'receptionist':
      return '/reception/register'
    case 'nurse':
      return '/nurse'
    case 'doctor':
      return '/doctor'
    case 'hr':
      return '/hr'
  }
}

/** Gate a route (or subtree) behind a real authenticated session. Unauthenticated -> /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="app-canvas flex min-h-screen items-center justify-center font-body-md">
        <p className="text-body-md text-on-surface-variant">Loading…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location } as { from: Location }} />
  }

  return children
}

/**
 * Gate a route to specific roles. Role comes from the verified session
 * (useAuth().user.role, set by the backend from user_application_access) -
 * never from anything the client can edit. A user whose role doesn't match
 * is redirected to their own home instead of seeing the page, closing the
 * "reach another role's dashboard by changing the URL" gap.
 */
export function RoleRoute({ roles, children }: { roles: StaffRole[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return null // RequireAuth above already handles no-session
  if (!roles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />
  }
  return children
}

/** `/` lands on whichever page is actually home for this user's real role. */
export function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return null
  return <Navigate to={roleHome(user.role)} replace />
}
