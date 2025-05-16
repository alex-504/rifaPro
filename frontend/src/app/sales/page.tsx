'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roles';
import DashboardLayout from '@/components/DashboardLayout';

export default function SalesPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN, ROLES.DRIVER]}>
      <DashboardLayout title="Vendas">
        <h1 className="text-2xl font-bold mb-4" style={{ color: '#6633FF', textShadow: '1px 1px 4px #e5e7eb' }}>Vendas</h1>
        <p className="text-gray-500">Bem-vindo à área de vendas!</p>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 