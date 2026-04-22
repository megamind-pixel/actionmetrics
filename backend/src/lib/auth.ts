import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JwtPayload } from '../types';
import { Role } from '@prisma/client';

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const EXPIRES = process.env.JWT_EXPIRES_IN ?? '7d';

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function normalise(score: number, type: 'percent' | 'gpa'): number {
  if (type === 'gpa') return Math.min(100, (score / 4) * 100);
  return Math.min(100, Math.max(0, score));
}

export const ROLE_RANK: Record<Role, number> = { SUPER: 3, ADMIN: 2, VIEWER: 1 };

export function hasRole(userRole: Role, required: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[required];
}
