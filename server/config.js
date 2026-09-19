'use strict';

require('dotenv').config();

// Real mode only kicks in once real MySQL credentials are actually
// supplied. Until then (which is the case today - no production DB access
// exists), the backend runs against an in-memory store with the exact same
// repository interface, so plugging in real credentials later is a config
// change, not a code change. See db/repository.js.
const hasDbCreds = Boolean(process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE);

module.exports = {
  isProduction: process.env.NODE_ENV === 'production',
  db: {
    mode: hasDbCreds ? 'mysql' : 'memory',
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  },
  server: {
    port: Number(process.env.PORT || 4000),
  },
  auth: {
    // Falls back to a locally-generated value on every boot when unset, so
    // dev mode (no real credentials yet) still works out of the box - real
    // deployments MUST set this explicitly to the real shared secret from
    // /opt/auth-api/.env, verified by SHA256 hash comparison per
    // SSO_TENANCY.md, never printed or committed.
    jwtSecret: process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex'),
  },
  otp: {
    length: Number(process.env.OTP_LENGTH || 6),
    expireMinutes: Number(process.env.OTP_EXPIRE_MINUTES || 5),
    cooldownSeconds: Number(process.env.OTP_COOLDOWN_SECONDS || 60),
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
  },
  authApi: {
    url: process.env.AUTH_API_URL || 'http://127.0.0.1:8080',
    // Fixed per SSO_TENANCY.md §4 Pattern A (single tenant per deployment) -
    // the brief explicitly calls for the "kumbh" tenant slug, baked in here,
    // never read from client input.
    tenantSlug: process.env.AUTH_API_TENANT_SLUG || 'kumbh',
  },
  // This app's own identity with auth-api. Real value only exists once
  // someone with production DB access runs the INSERT INTO application (...)
  // from SSO_TENANCY.md §5.3 and shares the real oauth_client_id back.
  application: {
    oauthClientId: process.env.CLINIC_OAUTH_CLIENT_ID || 'arogya-kumbh-clinic',
  },
};

if (!module.exports.isProduction && !process.env.JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.warn(
    '[config] JWT_SECRET not set - using a random per-boot value (fine for dev mode only). ' +
      'Set the real shared secret before deploying anywhere real traffic can reach this.',
  );
}
