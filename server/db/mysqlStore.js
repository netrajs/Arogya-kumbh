'use strict';

// Real-mode data access against the shared platform tables described in
// SSO_TENANCY.md. Only imported when config.db.mode === 'mysql' (see
// repository.js) - i.e. once real MYSQL_HOST/USER/DATABASE credentials are
// actually supplied. Every query here is read-only against
// user_application_access (per SSO_TENANCY.md §5: granting real users is an
// operator action against the shared DB, not something this app's runtime
// code does) and always filters by this app's own application_id - the
// doc's #1 recurring bug (§3.1) is an unfiltered role lookup.

const pool = require('./pool');
const config = require('../config');

let applicationIdCache = null;
let defaultTenantIdCache = null;

async function getApplicationId() {
  if (applicationIdCache) return applicationIdCache;
  const [rows] = await pool.query('SELECT id FROM application WHERE oauth_client_id = ?', [config.application.oauthClientId]);
  if (!rows.length) {
    throw new Error(
      `Application "${config.application.oauthClientId}" not found in auth-api's application table - ` +
        'it needs to be registered first (SSO_TENANCY.md §5 step 3).',
    );
  }
  applicationIdCache = rows[0].id;
  return applicationIdCache;
}

async function getDefaultTenantId() {
  if (defaultTenantIdCache) return defaultTenantIdCache;
  const [rows] = await pool.query('SELECT id FROM tenant_lh WHERE slug = ?', [config.authApi.tenantSlug]);
  if (!rows.length) {
    throw new Error(`Tenant "${config.authApi.tenantSlug}" not found in tenant_lh (SSO_TENANCY.md §5 step 4).`);
  }
  defaultTenantIdCache = rows[0].id;
  return defaultTenantIdCache;
}

async function findUserByEmail(email, tenantId) {
  const applicationId = await getApplicationId();
  const [rows] = await pool.query(
    `SELECT u.id, u.tenant_id, u.email, a.role, a.status
     FROM app_user u
     INNER JOIN user_application_access a ON a.user_id = u.id
     WHERE u.tenant_id = ? AND a.tenant_id = ? AND a.application_id = ? AND LOWER(u.email) = LOWER(?)
     LIMIT 1`,
    [tenantId, tenantId, applicationId, email],
  );
  return rows[0] || null;
}

async function findUserById(id, tenantId) {
  const applicationId = await getApplicationId();
  const [rows] = await pool.query(
    `SELECT u.id, u.tenant_id, u.email, a.role, a.status
     FROM app_user u
     INNER JOIN user_application_access a ON a.user_id = u.id
     WHERE u.id = ? AND u.tenant_id = ? AND a.tenant_id = ? AND a.application_id = ?
     LIMIT 1`,
    [id, tenantId, tenantId, applicationId],
  );
  return rows[0] || null;
}

async function listUsersForTenant(tenantId, applicationId) {
  const [rows] = await pool.query(
    `SELECT u.email, a.role
     FROM app_user u
     INNER JOIN user_application_access a ON a.user_id = u.id
     WHERE u.tenant_id = ? AND a.tenant_id = ? AND a.application_id = ?`,
    [tenantId, tenantId, applicationId],
  );
  return rows;
}

async function getRecentOtpForUser(userId, cooldownSeconds) {
  const [rows] = await pool.query(
    'SELECT id, created_at FROM otp_code WHERE user_id = ? AND created_at > (NOW() - INTERVAL ? SECOND) LIMIT 1',
    [userId, cooldownSeconds],
  );
  return rows[0] || null;
}

async function deleteOtpsForUser(userId) {
  await pool.query('DELETE FROM otp_code WHERE user_id = ?', [userId]);
}

async function insertOtpCode({ tenantId, userId, codeHash, expireMinutes }) {
  await pool.query(
    'INSERT INTO otp_code (id, tenant_id, user_id, code_hash, attempts, expires_at) VALUES (UUID(), ?, ?, ?, 0, NOW() + INTERVAL ? MINUTE)',
    [tenantId, userId, codeHash, expireMinutes],
  );
}

async function getLatestOtpForUser(userId) {
  const [rows] = await pool.query(
    'SELECT id, code_hash, attempts, expires_at FROM otp_code WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [userId],
  );
  return rows[0] || null;
}

async function incrementOtpAttempts(otpId) {
  await pool.query('UPDATE otp_code SET attempts = attempts + 1 WHERE id = ?', [otpId]);
}

async function deleteOtpById(otpId) {
  await pool.query('DELETE FROM otp_code WHERE id = ?', [otpId]);
}

module.exports = {
  getApplicationId,
  getDefaultTenantId,
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
