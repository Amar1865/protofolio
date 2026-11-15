import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import {
  createLocalUser,
  findUserByEmail,
  findUserById,
  logActivity,
  sanitizeUser,
  updateUserPasswordHash,
  updateUserProfile,
} from '../db/queries.ts';
import {
  AuthRequest,
  clearAuthCookie,
  requireAuth,
  resolveOptionalAuthUser,
  setAuthCookie,
  signJwtToken,
} from '../middleware/auth.ts';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'SGD', 'JPY'];
const ALLOWED_RISK_PROFILES = ['Conservative', 'Balanced', 'Growth', 'Aggressive'];

function validatePasswordStrength(password: unknown): string | null {
  if (typeof password !== 'string') {
    return 'Password is required.';
  }
  if (password.length < 8 || password.length > 128) {
    return 'Password must be between 8 and 128 characters long.';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include at least one letter and one number.';
  }
  return null;
}

function isUniqueConstraintError(err: any): boolean {
  return (
    err?.code === '23505' ||
    err?.cause?.code === '23505' ||
    (typeof err?.message === 'string' && err.message.includes('duplicate key'))
  );
}

async function ensureBootstrapAdmin(email: string) {
  const adminEmail = (
    process.env.ADMIN_EMAIL || 'admin@meridianwealth.io'
  ).toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword2026!';
  if (email.toLowerCase() !== adminEmail) return null;

  const existing = await findUserByEmail(adminEmail);
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const created = await createLocalUser({
    uid: `admin_${crypto.randomUUID()}`,
    fullName: 'System Administrator',
    email: adminEmail,
    passwordHash,
    role: 'admin',
    currency: 'USD',
    riskProfile: 'Balanced',
  });
  await logActivity({
    userId: created.id,
    actorEmail: created.email,
    action: 'ADMIN_INITIALIZED',
    entityType: 'auth',
    details: 'Initial administrator account provisioned in PostgreSQL.',
  });
  return created;
}

router.post('/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, currency, riskProfile } = req.body ?? {};

    if (
      typeof fullName !== 'string' ||
      fullName.trim().length < 2 ||
      fullName.trim().length > 100
    ) {
      return res
        .status(400)
        .json({ error: 'Full name must be between 2 and 100 characters long.' });
    }
    if (
      typeof email !== 'string' ||
      email.trim().length > 254 ||
      !EMAIL_REGEX.test(email.trim())
    ) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res
        .status(409)
        .json({ error: 'An account with this email address already exists.' });
    }

    const chosenCurrency =
      typeof currency === 'string' && ALLOWED_CURRENCIES.includes(currency)
        ? currency
        : 'USD';
    const chosenRisk =
      typeof riskProfile === 'string' && ALLOWED_RISK_PROFILES.includes(riskProfile)
        ? riskProfile
        : 'Balanced';

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await createLocalUser({
      uid: `local_${crypto.randomUUID()}`,
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'investor',
      currency: chosenCurrency,
      riskProfile: chosenRisk,
    });

    await logActivity({
      userId: created.id,
      actorEmail: created.email,
      action: 'USER_REGISTERED',
      entityType: 'auth',
      details: `New investor account created (${created.fullName}).`,
    });

    const token = signJwtToken({
      userId: created.id,
      email: created.email,
      role: created.role,
    });
    setAuthCookie(req, res, token);

    return res.status(201).json({
      user: sanitizeUser(created),
    });
  } catch (error: any) {
    if (isUniqueConstraintError(error)) {
      return res
        .status(409)
        .json({ error: 'An account with this email address already exists.' });
    }
    console.error('Registration error:', error);
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to register investor account.' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password, portal } = req.body ?? {};
    if (
      typeof email !== 'string' ||
      email.trim().length > 254 ||
      !EMAIL_REGEX.test(email.trim())
    ) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (typeof password !== 'string' || password.length === 0 || password.length > 128) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user =
      (await findUserByEmail(normalizedEmail)) ??
      (await ensureBootstrapAdmin(normalizedEmail));

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'This account is currently deactivated. Contact an administrator.',
      });
    }

    if (portal === 'admin' && user.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Administrator credentials are required for Admin Login.' });
    }

    await logActivity({
      userId: user.id,
      actorEmail: user.email,
      action: 'USER_LOGIN',
      entityType: 'auth',
      details: `Signed in via ${user.role} portal.`,
    });

    const token = signJwtToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    setAuthCookie(req, res, token);

    return res.json({
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to sign in.' });
  }
});

router.post('/auth/firebase', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication failed.' });
    }

    const token = signJwtToken({
      userId: req.authUser.id,
      email: req.authUser.email,
      role: req.authUser.role,
    });
    setAuthCookie(req, res, token);

    await logActivity({
      userId: req.authUser.id,
      actorEmail: req.authUser.email,
      action: 'USER_LOGIN',
      entityType: 'auth',
      details: 'Signed in via Google Authentication.',
    });
    return res.json({ user: req.authUser });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to authenticate session.' });
  }
});

router.post('/auth/logout', async (req, res) => {
  try {
    const actor = await resolveOptionalAuthUser(req);
    clearAuthCookie(req, res);

    if (actor) {
      await logActivity({
        userId: actor.id,
        actorEmail: actor.email,
        action: 'USER_LOGOUT',
        entityType: 'auth',
        details: 'Signed out and cleared session cookie.',
      });
    }

    return res.json({ message: 'Signed out successfully.' });
  } catch (error: any) {
    clearAuthCookie(req, res);
    return res.json({ message: 'Signed out successfully.' });
  }
});

router.get('/auth/me', requireAuth, (req: AuthRequest, res) => {
  return res.json({ user: req.authUser });
});

router.put('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { fullName, phone, currency, riskProfile } = req.body ?? {};
    if (typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res
        .status(400)
        .json({ error: 'Full name must be at least 2 characters long.' });
    }
    const cleanPhone = typeof phone === 'string' ? phone.trim().slice(0, 30) : '';
    const chosenCurrency =
      typeof currency === 'string' && ALLOWED_CURRENCIES.includes(currency)
        ? currency
        : req.authUser.currency;
    const chosenRisk =
      typeof riskProfile === 'string' && ALLOWED_RISK_PROFILES.includes(riskProfile)
        ? riskProfile
        : req.authUser.riskProfile;

    const updated = await updateUserProfile(req.authUser.id, {
      fullName: fullName.trim(),
      phone: cleanPhone,
      currency: chosenCurrency,
      riskProfile: chosenRisk,
    });

    if (!updated) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    await logActivity({
      userId: updated.id,
      actorEmail: updated.email,
      action: 'PROFILE_UPDATED',
      entityType: 'user',
      details: `Updated profile preferences (${updated.currency}, ${updated.riskProfile}).`,
    });

    return res.json({ user: sanitizeUser(updated) });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to update profile.' });
  }
});

router.put('/profile/password', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const { currentPassword, newPassword } = req.body ?? {};
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const userRecord = await findUserById(req.authUser.id);
    if (!userRecord) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    if (userRecord.passwordHash) {
      if (typeof currentPassword !== 'string' || !currentPassword) {
        return res.status(400).json({ error: 'Current password is required.' });
      }
      const matches = await bcrypt.compare(currentPassword, userRecord.passwordHash);
      if (!matches) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
    }

    const nextHash = await bcrypt.hash(newPassword, 12);
    await updateUserPasswordHash(userRecord.id, nextHash);

    await logActivity({
      userId: userRecord.id,
      actorEmail: userRecord.email,
      action: 'PASSWORD_CHANGED',
      entityType: 'auth',
      details: 'Password updated successfully.',
    });

    return res.json({ message: 'Password updated successfully.' });
  } catch (error: any) {
    console.error('Password change error:', error);
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to change password.' });
  }
});

export default router;
