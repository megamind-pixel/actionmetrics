import { Role } from '@prisma/client';

export interface JwtPayload {
  adminId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
