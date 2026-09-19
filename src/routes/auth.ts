import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { hashPassword, JWT_SECRET, requireAuth } from '../auth.js';
import { db } from '../db.js';
import { parseBody } from '../validation.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(6),
});

authRouter.post('/register', (req, res) => {
  const data = parseBody(registerSchema, req.body, res);
  if (!data) return;
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(data.email)) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(data.name, data.email, hashPassword(data.password));
  res.status(201).json(db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(lastInsertRowid));
});

authRouter.post('/login', (req, res) => {
  const user = db
    .prepare('SELECT id, name, email, role FROM users WHERE email = ? AND password_hash = ?')
    .get(req.body?.email, hashPassword(String(req.body?.password))) as
    | { id: number; name: string; email: string; role: string }
    | undefined;
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
  res.json({ token, user });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user!.id));
});
