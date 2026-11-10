import type { JwtPayload } from '../auth/auth.types.js';

export function canViewIncident(
  user: JwtPayload,
  reporterId: string,
  ownerId: string,
): boolean {
  if (user.role === 'ADMIN') return true;
  if (reporterId === user.sub) return true;
  return user.role === 'DEVELOPER' && ownerId === user.sub;
}

export function canManageIncident(user: JwtPayload, ownerId: string): boolean {
  if (user.role === 'ADMIN') return true;
  return user.role === 'DEVELOPER' && ownerId === user.sub;
}
