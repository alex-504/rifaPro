'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roles';
import DashboardLayout from '@/components/DashboardLayout';

export default function ReportsPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN, ROLES.DRIVER]}>
      <DashboardLayout title="Relatórios">
        <h1 className="text-2xl font-bold mb-4">Relatórios</h1>
        <p>Bem-vindo à área de relatórios!</p>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 