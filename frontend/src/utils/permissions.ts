import { Role } from '@/constants/roles';

export function hasRole(userRole: Role | null, allowedRoles: Role[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
} 