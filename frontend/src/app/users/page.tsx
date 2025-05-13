'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roles';

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN]}>
      <h1>Usuários do Sistema</h1>
      <p>Bem-vindo à área de administração de usuários!</p>
    </ProtectedRoute>
  );
}