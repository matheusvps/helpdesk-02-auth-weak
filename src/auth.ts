import crypto from 'node:crypto';
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = 'helpdesk-jwt-secret-2026';

export type Role = 'solicitante' | 'atendente';

export interface AuthUser {
  id: number;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET) as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
