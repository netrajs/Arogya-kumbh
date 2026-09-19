'use strict';

const express = require('express');
const authService = require('../services/authService');
const repository = require('../db/repository');

const router = express.Router();

async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const user = await authService.userFromAuthHeader(authHeader);
  if (!user) {
    return res.status(401).json({ error: 'Missing or invalid Authorization token' });
  }
  req.user = user;
  next();
}

/** Gate a route to one or more Clinic roles - never trusts anything the client sent, only req.user.role set by requireAuth above. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `This endpoint requires one of: ${roles.join(', ')}` });
    }
    next();
  };
}

// ---------- Auth ----------

const GENERIC_SENT_MESSAGE = 'If this email is registered, a code has been sent.';
const GENERIC_INVALID_MESSAGE = 'Invalid or expired code.';

router.post('/auth/send-otp', async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }
  try {
    await authService.requestOtp(email);
    res.json({ message: GENERIC_SENT_MESSAGE });
  } catch (err) {
    if (err instanceof authService.CooldownError) {
      return res.status(429).json({ error: err.message });
    }
    console.error('send-otp error:', err);
    res.status(500).json({ error: 'Internal server error while sending code' });
  }
});

router.post('/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ error: 'email and otp are required' });
  }
  try {
    const result = await authService.verifyOtp(email, otp);
    if (!result) {
      return res.status(400).json({ error: GENERIC_INVALID_MESSAGE });
    }
    res.json(result);
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ error: 'Internal server error during verification' });
  }
});

router.get('/auth/me', requireAuth, (req, res) => {
  const { email, role, tenant_id: tenantId } = req.user;
  res.json({ email, role, tenantId });
});

// ---------- Dev-only local sign-in ----------
// Only registered when NOT running as production - in a real production
// deployment these paths do not exist at all (not merely unreachable), so
// there is no flag to misconfigure and no handler sitting in production
// waiting to be reached. They mint nothing themselves: they drive the same
// local OTP flow authService.requestOtp/verifyOtp already use in dev mode.
if (authService.isDevMode()) {
  router.get('/dev/users', async (req, res) => {
    try {
      const tenantId = await repository.getDefaultTenantId();
      const applicationId = await repository.getApplicationId();
      const rows = await repository.listUsersForTenant(tenantId, applicationId);
      res.json(rows);
    } catch (err) {
      console.error('[dev] list users error:', err);
      res.status(500).json({ error: 'Failed to list local users' });
    }
  });

  router.post('/dev/session', async (req, res) => {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required' });

    try {
      try {
        await authService.requestOtp(email);
      } catch (err) {
        // A cooldown from a previous attempt is not a failure here - the
        // code from that attempt is still stashed and usable.
        if (!(err instanceof authService.CooldownError)) throw err;
      }

      const otp = authService.getDevOtp(email);
      if (!otp) {
        return res.status(404).json({ error: `No local OTP was issued for ${email} - is that address seeded?` });
      }

      const result = await authService.verifyOtp(email, otp);
      if (!result) return res.status(400).json({ error: 'Local sign-in failed to verify' });

      res.json(result);
    } catch (err) {
      console.error('[dev] session error:', err);
      res.status(500).json({ error: 'Local sign-in failed' });
    }
  });

  console.log('[dev] Local sign-in enabled at POST /api/dev/session (non-production only).');
}

module.exports = { router, requireAuth, requireRole };
