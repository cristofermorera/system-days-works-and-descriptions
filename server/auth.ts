import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'work_calendar_secure_secret_key_2026';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

// Password helpers
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

// Signed token helpers
export function generateToken(payload: { userId: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const data = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${data}`)
    .digest('base64url');
  return `${header}.${data}.${signature}`;
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${data}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

// Middleware: Require valid authenticated active user
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sessão não encontrada ou não autenticada.' });
    return;
  }

  const token = authHeader.substring(7).trim();
  const tokenPayload = verifyToken(token);
  if (!tokenPayload) {
    res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
    return;
  }

  const user = db
    .prepare('SELECT id, name, email, role, status FROM users WHERE id = ?')
    .get(tokenPayload.userId) as AuthenticatedUser | undefined;

  if (!user) {
    res.status(401).json({ error: 'Usuário não encontrado.' });
    return;
  }

  if (user.status !== 'active') {
    res.status(403).json({ error: 'Conta inativa. Entre em contato com o administrador.' });
    return;
  }

  req.user = user;
  next();
}

// Middleware: Require administrator role
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        error: 'Acesso negado. Esta operação requer perfil de administrador.',
      });
      return;
    }
    next();
  });
}

// Helper to log audit actions
export function logAudit(userId: string, userName: string, action: string, target?: string): void {
  try {
    const id = 'log_' + crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO audit_logs (id, user_id, user_name, action, target, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, userId, userName, action, target || null, now);
  } catch (err) {
    console.error('Falha ao gravar log de auditoria:', err);
  }
}
