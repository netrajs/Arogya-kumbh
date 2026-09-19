'use strict';

const crypto = require('crypto');

// In-process mock of the shared platform tables (tenant_lh, application,
// app_user, user_application_access, otp_code) described in
// SSO_TENANCY.md, used only when no real MySQL credentials are configured
// (see config.js). Exists purely so the auth flow can be developed and
// demoed without touching any real database - it is never written to
// unconditionally on boot beyond this fixed dev seed, and it never talks to
// anything outside this process.
//
// Seed emails intentionally match the demo StaffMember records already in
// src/lib/store.tsx, so a dev login resolves to an existing Clinic staff
// profile end-to-end.

const TENANT = { id: crypto.randomUUID(), slug: 'kumbh', name: 'Arogya Kumbh' };
const APPLICATION = { id: crypto.randomUUID(), oauth_client_id: 'arogya-kumbh-clinic' };

const users = [
  { id: crypto.randomUUID(), tenant_id: TENANT.id, email: 'sara.khan@daikoclinic.example', name: 'Sara Khan', role: 'receptionist' },
  { id: crypto.randomUUID(), tenant_id: TENANT.id, email: 'priya.shah@daikoclinic.example', name: 'Priya Shah', role: 'nurse' },
  { id: crypto.randomUUID(), tenant_id: TENANT.id, email: 'arjun.mehta@daikoclinic.example', name: 'Dr. Arjun Mehta', role: 'doctor' },
  { id: crypto.randomUUID(), tenant_id: TENANT.id, email: 'ananya.gupta@daikoclinic.example', name: 'Ananya Gupta', role: 'hr' },
];

const otps = new Map(); // otp id -> row

async function getDefaultTenantId() {
  return TENANT.id;
}

async function getApplicationId() {
  return APPLICATION.id;
}

function toAccessRow(user) {
  return { email: user.email, name: user.name, role: user.role };
}

async function findUserByEmail(email, tenantId) {
  const user = users.find((u) => u.tenant_id === tenantId && u.email.toLowerCase() === String(email).trim().toLowerCase());
  return user ? { ...user, ...toAccessRow(user) } : null;
}

async function findUserById(id, tenantId) {
  const user = users.find((u) => u.id === id && u.tenant_id === tenantId);
  return user ? { ...user, ...toAccessRow(user) } : null;
}

/** Every seeded user for one tenant+application - backs GET /api/dev/users. */
async function listUsersForTenant(tenantId, _applicationId) {
  return users
    .filter((u) => u.tenant_id === tenantId)
    .map((u) => ({ email: u.email, name: u.name, role: u.role }));
}

async function getRecentOtpForUser(userId, cooldownSeconds) {
  const cutoff = Date.now() - cooldownSeconds * 1000;
  let latest = null;
  for (const row of otps.values()) {
    if (row.user_id !== userId) continue;
    if (new Date(row.created_at).getTime() < cutoff) continue;
    if (!latest || new Date(row.created_at) > new Date(latest.created_at)) latest = row;
  }
  return latest;
}

async function deleteOtpsForUser(userId) {
  for (const [id, row] of otps.entries()) {
    if (row.user_id === userId) otps.delete(id);
  }
}

async function insertOtpCode({ tenantId, userId, codeHash, expireMinutes }) {
  const id = crypto.randomUUID();
  const now = new Date();
  otps.set(id, {
    id,
    tenant_id: tenantId,
    user_id: userId,
    code_hash: codeHash,
    attempts: 0,
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + expireMinutes * 60000).toISOString(),
  });
  return id;
}

async function getLatestOtpForUser(userId) {
  let latest = null;
  for (const row of otps.values()) {
    if (row.user_id !== userId) continue;
    if (!latest || new Date(row.created_at) > new Date(latest.created_at)) latest = row;
  }
  return latest;
}

async function incrementOtpAttempts(otpId) {
  const row = otps.get(otpId);
  if (row) row.attempts += 1;
}

async function deleteOtpById(otpId) {
  otps.delete(otpId);
}

module.exports = {
  getDefaultTenantId,
  getApplicationId,
  findUserByEmail,
  findUserById,
  listUsersForTenant,
  getRecentOtpForUser,
  deleteOtpsForUser,
  insertOtpCode,
  getLatestOtpForUser,
  incrementOtpAttempts,
  deleteOtpById,
};
