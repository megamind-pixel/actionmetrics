import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { verifyToken, hasRole } from '../lib/auth';
import { JwtPayload } from '../types';
import { Role } from '@prisma/client';

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/* ── JWT Verify ── */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/* ── Role Guard ── */
export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !hasRole(req.user.role, role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

/* ── Zod Validation ── */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: result.error.errors[0]?.message ?? 'Validation failed',
        details: result.error.errors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

/* ── Global Error Handler ── */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  console.error('[Error]', err);
  if (err instanceof Error) {
    res.status(500).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
}
