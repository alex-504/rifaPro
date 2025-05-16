'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roles';
import DashboardLayout from '@/components/DashboardLayout';

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN]}>
      <DashboardLayout title="Usuários">
        <h1 className="text-2xl font-bold mb-4" style={{ color: '#6633FF', textShadow: '1px 1px 4px #e5e7eb' }}>Usuários do Sistema</h1>
        <p className="text-gray-500">Bem-vindo à área de administraçãooo de usuários!</p>
      </DashboardLayout>
    </ProtectedRoute>
  );
}