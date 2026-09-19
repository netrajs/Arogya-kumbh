# SSO Authentication & Role-Based Access — Design

## Context

`SSO_TENANCY.md` (provided by the user) describes the shared identity/tenancy
layer every Fivetrees app builds on: `auth-api` is the only service that ever
authenticates anyone; every app verifies its JWTs locally with a shared
secret and re-derives role from `user_application_access`, scoped to
`(tenant_id, user_id, this app's application_id)`.

The user also pointed at a real, already-implemented reference —
[FivetreesTechnologies/leave_management](https://github.com/FivetreesTechnologies/leave_management)
(Daiko LMS) — with the instruction to reuse its auth implementation rather
than design one from scratch. This spec is that adaptation, not a new
design: `backend/services/authService.js`, `backend/routes/api.js`'s auth
routes, and `frontend/src/{api/client.js, context/AuthContext.jsx,
layouts/RoleGuard.jsx}` were read in full and are mirrored here, adapted
for Clinic's four roles (doctor/nurse/receptionist/hr) instead of Daiko
LMS's three (employee/manager/hr).

**Hard constraints established before writing any code (confirmed with the
user):**
- No real credentials exist yet (`JWT_SECRET`, `AUTH_API_URL`, MySQL creds
  for `notes_app`) — nothing here can reach the real `auth-api` or database.
- Clinic is not yet registered with auth-api (no `application` row, no
  `kumbh` tenant confirmed, no known `application_id`).
- Scope is auth only — Clinic's own data (patients/visits/staff) stays in
  `localStorage`, not migrated to a real database in this effort.
- Local dev/testing uses a mock mode, not a requirement for real
  credentials to run at all.
- A MySQL 8.0 server happens to already be running on this machine, unowned
  and with unknown contents — it is **not** used for anything here; local
  dev mode is in-memory instead, behind the same repository interface the
  real MySQL path uses.

## Architecture

A new `server/` directory holds Clinic's first-ever backend (Node + Express,
CommonJS, matching the reference's style). It's the only thing that ever
sees `JWT_SECRET` or (eventually) database credentials. The Vite dev server
proxies `/api/*` to it (`server.proxy` in `vite.config.ts`) so there's no
CORS complexity in development.

```
server/
  config.js              # required() env vars, same pattern as reference
  server.js              # express app, cors, json, mounts /api
  db/
    repository.js        # findUserByEmail/findById, OTP CRUD — same
                          # function signatures regardless of backing store
    memoryStore.js        # in-memory backing store + seed data (dev mode)
    mysqlStore.js          # mysql2-backed store (real mode; unused until
                          # real credentials exist)
    platformConfig.js     # getApplicationId(), getDefaultTenantId()
  services/
    authService.js        # OTP request/verify, JWT sign/verify (local +
                          # external), userFromAuthHeader — ported from the
                          # reference almost unchanged
  routes/
    api.js                # /auth/send-otp, /auth/verify-otp, /auth/me,
                          # /dev/users, /dev/session (dev-mode only)
  .env.example
```

`repository.js` exports the same function signatures (`findUserByEmail`,
`findUserById`, OTP CRUD) regardless of which store backs it — selected
once at startup by `config.db.mode`, itself derived from whether
`MYSQL_HOST` etc. are set: unset → `memoryStore`, set → `mysqlStore`. This
is the seam that lets the real MySQL path be fully implemented and ready,
without needing a real database to develop or demo against today. When real
credentials arrive later, setting the env vars is enough — no code changes.

## Auth flow (ported from the reference)

### Real path (`requestOtpViaAuthApi` / `verifyOtpViaAuthApi`)
- `POST /api/auth/send-otp {email}` → `POST {AUTH_API_URL}/capAm/authentication/sendOtp` with `{tenant: 'kumbh', email}`. Always returns the same generic message regardless of outcome (no email enumeration) — exactly as the reference does.
- `POST /api/auth/verify-otp {email, otp}` → `POST {AUTH_API_URL}/capAm/authentication/verifyOtp`, returns `{access_token}`. Backend resolves the local user by `(email, tenant_id)` via `getDefaultTenantId()` and returns `{token, user}` to the frontend.
- `verifyExternalJwt(token)` — manually verifies the 3-part `header.payload.sig` HS256 JWT using `crypto.createHmac('sha256', JWT_SECRET)` and `crypto.timingSafeEqual`, checks `exp`. No `jsonwebtoken` dependency needed — this is exactly the reference's own implementation, copied verbatim (it's a small, self-contained, well-reasoned piece of code).
- `userFromAuthHeader(authHeader)` reads `Authorization: Bearer <token>`, verifies it, then resolves `{tenant_id, user_id}` from the payload against `user_application_access` (via `findUserById`).

### Dev/mock path (`requestOtpLocal` / `verifyOtpLocal`)
Active when `NODE_ENV !== 'production'` (the reference gates this on
`NODE_ENV === 'test'`; renamed here since "test" implies a test runner,
which isn't what's happening — this is a local-dev convenience, not an
automated test suite). Generates and hashes a real OTP locally, stores it
against the in-memory `otp_code`-shaped record, and signs a locally-HMACed
2-part token (`sign()`/`verify()` in the reference) instead of calling out
to `auth-api`. `getTestOtp(email)` stashes the plaintext so `/dev/session`
can read it back — never exposed over any route a production build would
serve.

### `/api/dev/users` + `/api/dev/session`
Only registered when `NODE_ENV !== 'production'` (same pattern as the
reference's `if (process.env.NODE_ENV === 'test') { router.get('/dev/users', ...) }`
block — in production these paths don't exist, not merely go unused).
`/dev/users` lists the seeded demo accounts (one per Clinic role) so a
"quick sign in as…" picker can render; `/dev/session {email}` drives the
same local OTP flow end-to-end (request → read back the stashed code →
verify) and returns a real session token — not a shortcut that mints
anything different from a genuine login.

## Role-based access

`user_application_access` rows (in-memory for now) are shaped
`{tenant_id, user_id, application_id, role, status}` exactly per
`SSO_TENANCY.md` §1. `findUserByEmail`/`findUserById` join this with the
user's identity record and always filter by `application_id` — the doc's
#1 recurring bug (§3.1) — so a Clinic login can never resolve a role granted
for a different Fivetrees app.

Middleware (`server/routes/api.js`):
```js
async function requireAuth(req, res, next) { /* verifies Bearer token, sets req.user */ }
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
```
(The reference's `requireHr`/`requireApprover` are Daiko-LMS-specific two-tier checks; Clinic has four flat roles, so this generalizes to one `requireRole(...roles)` factory instead.)

`GET /api/auth/me` returns `{email, role, tenant_id}` — **the only source of
truth for role** the frontend ever reads. Nothing about role is ever
sent by the client or stored client-editable.

## Frontend changes

- **`src/lib/apiClient.ts`** — ported from the reference's `client.js`: `fetch` wrapper, Bearer token from `localStorage` (`arogya-kumbh-token`), 401 → clear token + redirect to `/login`.
- **`src/lib/AuthContext.tsx`** — replaces `activeUser.tsx`'s "pick any role/any staff" state with real session state: on mount, load token → call `/auth/me` → `{user, loading, isAuthenticated}`; `sendOtp`, `verifyOtp`, `logout`. (`activeUser.tsx` is removed; every consumer of `useActiveUser()` moves to `useAuth()`.)
- **`src/pages/Login.tsx`** — email → OTP form. In dev builds only (`import.meta.env.DEV`, compiled away in production exactly like the reference does it), also renders a "Quick sign in as…" list from `/api/dev/users` — this is what keeps the "multiple demo users" experience alive, but it is the *backend* that decides who these users are and what role they get; the frontend just lists whatever the backend returns.
- **Route guards** — every role-specific route wrapped in a `RoleGuard`-equivalent (ported from the reference's `layouts/RoleGuard.jsx`): unauthenticated → redirect to `/login`; wrong role → redirect to that user's own home instead of rendering. This closes the gap flagged in the brief and confirmed by testing earlier this session (any role could previously reach any URL).
- **`Topbar.tsx`** — the editable "Role" / "Signed in as" `<select>` dropdown (today's fake auth) is removed. Replaced with the real signed-in user's name/role (read-only, from `/auth/me`) and a Logout button. The dev-only quick-switch lives on the login page instead, not as an in-app privilege-escalation control.
- **`AppShell.tsx`** — `navByRole` keyed exactly as today, just sourced from `useAuth().user.role` instead of `useActiveUser().active.role`.

### Bridging to Clinic's existing local data
Clinic's own patients/visits/staff stay in `localStorage` (per the "auth
only" scope decision). The authenticated session provides `{email, role,
tenant_id}`, not a Clinic `StaffMember.id`. The bridge: on login, resolve
`state.staff.find(s => s.email.toLowerCase() === session.email.toLowerCase())`
to get the matching local `StaffMember` (for `site`/display purposes) —
Clinic's seed staff already carry `email` fields (added for HR onboarding
earlier this session), so the demo seed users below reuse those same
addresses, making the whole flow coherent end-to-end. A logged-in user with
no matching local `StaffMember` (a real gap once this becomes non-demo)
gets a clear "no staff profile on file" state rather than a crash.

`store.tsx`'s localStorage key becomes tenant-namespaced
(`daiko-clinic-v2-<tenant_id>` using the real `tenant_id` from the verified
session) instead of one fixed global key — the concrete, honest way to
"scope by tenant_id" given the data itself isn't in a real per-tenant
database yet.

## Dev seed data (in-memory, `server/db/memoryStore.js`)

One tenant (`kumbh`), one application (`arogya-kumbh-clinic`), four users —
reusing the exact seed emails already in `src/lib/store.tsx` so a dev login
maps onto an existing demo `StaffMember`:

| Email | Role |
|---|---|
| `sara.khan@daikoclinic.example` | receptionist |
| `priya.shah@daikoclinic.example` | nurse |
| `arjun.mehta@daikoclinic.example` | doctor |
| `ananya.gupta@daikoclinic.example` | hr |

## What this does *not* do

- Does not connect to the real `auth-api` or MySQL — no credentials exist.
- Does not register Clinic with auth-api (`application`/`tenant_lh`/`tenant_application` rows) — needs production DB write access neither the user nor I have; documented as a prerequisite in `server/.env.example` comments and the README instead.
- Does not migrate Clinic's patient/visit/staff data to a real database.
- Does not touch the pre-existing, unrelated local MySQL 8.0 server found running on this machine.

## Testing

No test framework exists in this repo (confirmed earlier this session).
Verification is: `npx tsc -b` (frontend), a manual smoke test of the
in-memory dev flow (send-otp → verify-otp → me → role-gated routes,
including confirming a Nurse session gets redirected away from `/hr`), and
confirming existing Reception/Nurse/Doctor/HR page behavior is unchanged
once signed in.
