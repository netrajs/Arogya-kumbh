'use strict';

// Ported from FivetreesTechnologies/leave_management's
// backend/services/authService.js (read in full before writing this file),
// adapted for Clinic's dev-mode gate (NODE_ENV !== 'production' instead of
// NODE_ENV === 'test' - this is a local-dev convenience, not a test-runner
// concern) and Clinic's flat four-role model instead of Daiko LMS's
// employee/manager/hr hierarchy.

const crypto = require('crypto');
const repository = require('../db/repository');
const config = require('../config');

function isDevMode() {
  return !config.isProduction;
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', config.auth.jwtSecret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verify(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', config.auth.jwtSecret).update(body).digest('base64url');
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function generateOtp() {
  const max = 10 ** config.otp.length;
  return String(crypto.randomInt(0, max)).padStart(config.otp.length, '0');
}

function hashOtp(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

class CooldownError extends Error {
  constructor(waitSeconds) {
    super(`Please wait ${waitSeconds}s before requesting another code.`);
    this.waitSeconds = waitSeconds;
  }
}

// Dev-only: stashes the plaintext OTP per email so /dev/session can read it
// back instead of guessing/hardcoding a code. Never populated, and never
// read from, when running as production.
const devOtps = new Map();
function getDevOtp(email) {
  return devOtps.get(String(email).trim().toLowerCase());
}

function toPublicUser(user) {
  if (!user) return null;
  const { email, role, tenant_id: tenantId } = user;
  return { email, role, tenantId };
}

/**
 * Dev-mode OTP request: generates/hashes/stores the code against the
 * configured repository (in-memory unless real MySQL credentials are set)
 * and stashes the plaintext for getDevOtp(). No network call to auth-api,
 * no real email sent. Resolves against getDefaultTenantId() (the fixed
 * "kumbh" tenant slug) since there's no JWT yet at this point in the flow.
 */
async function requestOtpDev(email) {
  const tenantId = await repository.getDefaultTenantId();
  const user = await repository.findUserByEmail(email, tenantId);
  if (!user) return; // same generic outcome either way - see routes/api.js

  const recent = await repository.getRecentOtpForUser(user.id, config.otp.cooldownSeconds);
  if (recent) {
    const waitSeconds = config.otp.cooldownSeconds - Math.floor((Date.now() - new Date(recent.created_at).getTime()) / 1000);
    throw new CooldownError(Math.max(waitSeconds, 1));
  }

  await repository.deleteOtpsForUser(user.id);

  const code = generateOtp();
  await repository.insertOtpCode({
    tenantId,
    userId: user.id,
    codeHash: hashOtp(code),
    expireMinutes: config.otp.expireMinutes,
  });

  devOtps.set(user.email.trim().toLowerCase(), code);
}

async function verifyOtpDev(email, otp) {
  const tenantId = await repository.getDefaultTenantId();
  const user = await repository.findUserByEmail(email, tenantId);
  if (!user) return null;

  const otpRow = await repository.getLatestOtpForUser(user.id);
  if (!otpRow || new Date(otpRow.expires_at) < new Date()) return null;

  if (otpRow.attempts >= config.otp.maxAttempts) {
    await repository.deleteOtpById(otpRow.id);
    return null;
  }

  if (otpRow.code_hash !== hashOtp(otp)) {
    await repository.incrementOtpAttempts(otpRow.id);
    return null;
  }

  await repository.deleteOtpById(otpRow.id);

  // Same payload shape as a real verified JWT (userId/tenantId), so
  // userFromAuthHeader's dev branch resolves a tenant-scoped user exactly
  // the way the real branch does below.
  const token = sign({ userId: user.id, tenantId: user.tenant_id, issuedAt: Date.now() });
  return { token, user: toPublicUser(user) };
}

/**
 * Real path: delegates OTP send/verify to auth-api (SSO_TENANCY.md §2)
 * instead of doing it in-process. auth-api owns its own OTP
 * generation/hashing/emailing against its own database.
 */
async function requestOtpViaAuthApi(email) {
  const res = await fetch(`${config.authApi.url}/capAm/authentication/sendOtp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant: config.authApi.tenantSlug, email }),
  });

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    const match = /Please wait (\d+)s/.exec(body.detail || '');
    throw new CooldownError(match ? Number(match[1]) : config.otp.cooldownSeconds);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`auth-api sendOtp failed (${res.status}): ${body.detail || res.statusText}`);
  }
}

async function verifyOtpViaAuthApi(email, otp) {
  const res = await fetch(`${config.authApi.url}/capAm/authentication/verifyOtp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant: config.authApi.tenantSlug, email, otp }),
  });

  if (!res.ok) return null;

  const { access_token: accessToken } = await res.json();
  const payload = verifyExternalJwt(accessToken);
  if (!payload || !payload.user_id || !payload.tenant_id) return null;

  const user = await repository.findUserById(payload.user_id, payload.tenant_id);
  if (!user) return null;

  return { token: accessToken, user: toPublicUser(user) };
}

/**
 * Verifies a standard HS256 JWT issued by auth-api, using the JWT_SECRET
 * shared between both services (SSO_TENANCY.md §2.3-2.4). Returns the
 * decoded payload, or null if the signature doesn't match or the token has
 * expired. No network call to auth-api - verification is always local.
 */
function verifyExternalJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;

  const expectedSig = crypto
    .createHmac('sha256', config.auth.jwtSecret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  const given = Buffer.from(sigB64);
  const expected = Buffer.from(expectedSig);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (payload.exp && Date.now() >= payload.exp * 1000) return null;
  return payload;
}

/**
 * Sends an OTP to `email` if (and only if) it resolves to a real user with
 * access to this tenant + application. Always returns the same generic
 * outcome either way (see routes/api.js) so this endpoint can't be used to
 * enumerate registered emails.
 */
async function requestOtp(email) {
  if (isDevMode()) return requestOtpDev(email);
  return requestOtpViaAuthApi(email);
}

/** Verifies the OTP and, on success, issues a session token. Returns null on any failure. */
async function verifyOtp(email, otp) {
  if (isDevMode()) return verifyOtpDev(email, otp);
  return verifyOtpViaAuthApi(email, otp);
}

/**
 * Resolves a request's Authorization: Bearer <token> header into a user, or
 * null. tenant_id comes off the token itself, never from a boot-time config
 * value - see SSO_TENANCY.md §2.4 (JWT claims carry tenant_id; role is
 * re-derived per app, never carried on the token).
 */
async function userFromAuthHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length);

  if (isDevMode()) {
    const payload = verify(token);
    if (payload && payload.userId && payload.tenantId) {
      return repository.findUserById(payload.userId, payload.tenantId);
    }
    // Fall through: a dev server can still be handed a real auth-api token
    // (e.g. once real credentials are configured) even before flipping
    // NODE_ENV=production, so don't assume a locally-signed token is the
    // only valid shape.
  }

  const payload = verifyExternalJwt(token);
  if (!payload || !payload.user_id || !payload.tenant_id) return null;
  return repository.findUserById(payload.user_id, payload.tenant_id);
}

module.exports = { requestOtp, verifyOtp, userFromAuthHeader, CooldownError, getDevOtp, isDevMode };
