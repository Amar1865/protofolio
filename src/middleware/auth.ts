import crypto from 'node:crypto';
import { CookieOptions, NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  findUserById,
  SafeUser,
  sanitizeUser,
  upsertFirebaseUser,
} from '../db/queries.ts';
import { adminAuth } from '../lib/firebase-admin.ts';

export const AUTH_COOKIE_NAME = 'pipm_auth_token';

const RUNTIME_FALLBACK_SECRET = crypto
  .createHash('sha256')
  .update(process.env.SQL_HOST || 'meridian-wealth-portfolio-secret-key')
  .digest('hex');

function getJwtSecret(): string {
  return process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16
    ? process.env.JWT_SECRET.trim()
    : RUNTIME_FALLBACK_SECRET;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  authUser?: SafeUser;
}

export function signJwtToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(';')) {
    const eqIndex = part.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = part.slice(0, eqIndex).trim();
    const rawVal = part.slice(eqIndex + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(rawVal);
    } catch {
      cookies[key] = rawVal;
    }
  }
  return cookies;
}

function getAuthCookieBaseOptions(req: Request): CookieOptions {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const isHttps =
    req.secure ||
    forwardedProto === 'https' ||
    (Array.isArray(forwardedProto) && forwardedProto.includes('https'));

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
  };
}

export function setAuthCookie(req: Request, res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...getAuthCookieBaseOptions(req),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(req: Request, res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieBaseOptions(req));
}

function extractRequestToken(req: Request): {
  token: string | null;
  source: 'cookie' | 'bearer' | null;
} {
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[AUTH_COOKIE_NAME]?.trim();
  if (cookieToken) {
    return { token: cookieToken, source: 'cookie' };
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice('Bearer '.length).trim();
    if (bearerToken) {
      return { token: bearerToken, source: 'bearer' };
    }
  }

  return { token: null, source: null };
}

export async function resolveOptionalAuthUser(
  req: Request
): Promise<SafeUser | null> {
  const { token } = extractRequestToken(req);
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    if (decoded && typeof decoded.userId === 'number') {
      const user = await findUserById(decoded.userId);
      if (user && user.status === 'active') {
        return sanitizeUser(user);
      }
    }
  } catch {
    // Ignore invalid JWT in optional resolution
  }
  return null;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const { token, source } = extractRequestToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    if (decoded && typeof decoded.userId === 'number') {
      const user = await findUserById(decoded.userId);
      if (!user) {
        if (source === 'cookie') clearAuthCookie(req, res);
        return res.status(401).json({ error: 'Account no longer exists.' });
      }
      if (user.status !== 'active') {
        if (source === 'cookie') clearAuthCookie(req, res);
        return res.status(403).json({
          error: 'Your account has been deactivated. Contact an administrator.',
        });
      }
      req.authUser = sanitizeUser(user);
      return next();
    }
  } catch {
    // Not a local JWT; if Bearer token, attempt Firebase ID token verification below.
  }

  if (source === 'bearer') {
    try {
      const firebaseDecoded = await adminAuth.verifyIdToken(token);
      if (!firebaseDecoded.email) {
        return res
          .status(401)
          .json({ error: 'Token does not include a verified email.' });
      }
      const user = await upsertFirebaseUser({
        uid: firebaseDecoded.uid,
        email: firebaseDecoded.email,
        fullName: firebaseDecoded.name || firebaseDecoded.email.split('@')[0],
      });
      if (user.status !== 'active') {
        return res.status(403).json({
          error: 'Your account has been deactivated. Contact an administrator.',
        });
      }
      req.authUser = sanitizeUser(user);
      return next();
    } catch {
      return res
        .status(401)
        .json({ error: 'Invalid or expired authentication token.' });
    }
  }

  if (source === 'cookie') clearAuthCookie(req, res);
  return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.authUser) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.authUser.role !== 'admin') {
    return res
      .status(403)
      .json({ error: 'Administrator privileges are required for this action.' });
  }
  return next();
}
