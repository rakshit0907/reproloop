import type { Request } from 'express';
import type { UserRole } from '../users/user.entity.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export type AuthenticatedRequest = Request & { user: JwtPayload };

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}
