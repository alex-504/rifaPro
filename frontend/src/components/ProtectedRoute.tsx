import { useAuth } from '@/providers/AuthProvider';
import { hasRole } from '@/utils/permissions';
import { Role } from '@/constants/roles';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  allowedRoles: Role[];
  children: ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) return <div>Carregando...</div>;
  if (!user || !hasRole(role, allowedRoles)) {
    return <div>Acesso negado</div>;
  }
  return <>{children}</>;
} 