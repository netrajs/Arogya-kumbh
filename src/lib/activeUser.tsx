import { useAuth } from './AuthContext'
import { useClinic } from './store'
import type { StaffRole } from './types'

export interface ActiveUser {
  role: StaffRole
  staffId: string
}

/**
 * Bridges the real authenticated session (role from user_application_access,
 * via /auth/me) to Clinic's own local demo data model (StaffMember, Site),
 * which still lives in localStorage - see the SSO design spec's "Bridging
 * to Clinic's existing local data" section. The match is by email: Clinic's
 * seed StaffMember records carry the same addresses as the backend's dev
 * user seed, so a login resolves to an existing staff profile end to end.
 *
 * `active.role` always comes from the verified session, never from the
 * matched StaffMember - role/access control is the SSO session's call, the
 * StaffMember match is only used for site/display-name purposes.
 */
export function useActiveUser() {
  const { user } = useAuth()
  const { staff, getStaffSite } = useClinic()

  const staffMember = user ? staff.find((s) => s.email.toLowerCase() === user.email.toLowerCase()) : undefined
  const site = staffMember ? getStaffSite(staffMember.id) : undefined

  const active: ActiveUser = {
    role: (user?.role ?? 'receptionist') as StaffRole,
    staffId: staffMember?.id ?? '',
  }

  return { active, staffMember, site }
}
