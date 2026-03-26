import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';

// Hardcoded admin allowlist with hashed passwords
// Passwords loaded from env vars: ADMIN_GEORGE_PASSWORD, ADMIN_HUGO_PASSWORD
// Defaults are set for development only — override in production via env vars
const ADMIN_USERS: Record<string, string> = {
  'george@attlee.ai': process.env.ADMIN_GEORGE_PASSWORD || 'attlee-admin-dev',
  'hugo@attlee.ai': process.env.ADMIN_HUGO_PASSWORD || 'attlee-admin-dev',
};

export function isAdminEmail(email: string): boolean {
  return email in ADMIN_USERS;
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const storedPassword = ADMIN_USERS[email];
  if (!storedPassword) return false;
  // Support both plain-text env vars and bcrypt hashes
  if (storedPassword.startsWith('$2')) {
    return bcrypt.compare(password, storedPassword);
  }
  return password === storedPassword;
}

export function requireAdminSession(req: Request, res: Response, next: NextFunction) {
  const session = (req as any).session;
  if (!session?.adminUser || !isAdminEmail(session.adminUser)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
