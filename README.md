# Arogya Kumbh Clinic

A React + TypeScript + Vite frontend (`src/`) with an Express backend
(`server/`) handling authentication.

## Running locally

```bash
npm install
npm --prefix server install
npm --prefix server run dev   # backend on :4000
npm run dev                   # frontend on :5174, proxies /api to :4000
```

With no `.env` configured, the backend runs in **dev mode**: OTP codes are
generated locally (never emailed), and role lookups come from a small
in-memory seed of one demo user per Clinic role (see
`server/db/memoryStore.js`), not any real database. The login page's
"Quick sign in" list only exists in this mode.

## Switching to real SSO (`SSO_TENANCY.md`)

This app authenticates through `auth-api`, the shared identity service every
Fivetrees app uses — see `docs/superpowers/specs/2026-09-20-sso-auth-design.md`
for the full design. To point it at the real service instead of dev mode,
someone with access to the production box/database needs to:

1. Share the real `JWT_SECRET` (from `/opt/auth-api/.env`).
2. Register this app in auth-api's `application` table and share the real
   `oauth_client_id` (`CLINIC_OAUTH_CLIENT_ID`).
3. Confirm the `kumbh` tenant exists in `tenant_lh` and has this app enabled
   via `tenant_application`.
4. Grant real users access via `user_application_access`, scoped to this
   app's `application_id`.
5. Provide MySQL connection details for the `notes_app` database.

Then set `NODE_ENV=production` plus `JWT_SECRET`, `AUTH_API_URL`,
`CLINIC_OAUTH_CLIENT_ID`, and `MYSQL_HOST`/`MYSQL_USER`/`MYSQL_PASSWORD`/
`MYSQL_DATABASE` in `server/.env` (copy `server/.env.example`) — no code
changes needed, `server/db/repository.js` switches to the real MySQL-backed
store automatically once those are set.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
