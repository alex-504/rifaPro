'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roles';
import DashboardLayout from '@/components/DashboardLayout';

export default function DriversPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN]}>
      <DashboardLayout title="Motoristas">
        <h1 className="text-2xl font-bold mb-4" style={{ color: '#6633FF' }}>Motoristas</h1>
        <p>Bem-vindo à área de motoristas!</p>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 