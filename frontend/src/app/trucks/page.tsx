'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roles';
import DashboardLayout from '@/components/DashboardLayout';

export default function TrucksPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN, ROLES.DRIVER]}>
      <DashboardLayout title="Caminhões">
        <h1 className="text-2xl font-bold mb-4" style={{ color: '#6633FF', textShadow: '1px 1px 4px #e5e7eb' }}>Caminhões</h1>
        <p className="text-gray-700">Bem-vindo à área de caminhões!</p>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 