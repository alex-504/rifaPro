"use client";

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roles';

function KpiCard({ title, value, icon }: { title: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
      {icon && <div className="text-3xl text-blue-600">{icon}</div>}
      <div>
        <div className="text-gray-500 text-sm">{title}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN]}>
      <div className="min-h-screen flex bg-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg p-6 hidden md:block">
          <img src="/rifapro-logo.svg" alt="RifaPro Logo" className="mb-8" />
          <nav className="flex flex-col gap-4">
            <a href="/dashboard" className="text-blue-600 font-semibold">Dashboard</a>
            <a href="/users" className="text-gray-700 hover:text-blue-600">Usuários</a>
            <a href="/warehouses" className="text-gray-700 hover:text-blue-600">Galpões</a>
            <a href="/products" className="text-gray-700 hover:text-blue-600">Produtos</a>
            <a href="/sales" className="text-gray-700 hover:text-blue-600">Vendas</a>
            <a href="/end-clients" className="text-gray-700 hover:text-blue-600">Clientes Finais</a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Header */}
          <header className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold" style={{ color: '#33CCCC' }}>Dashboard</h1>
          </header>

          {/* KPIs */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <KpiCard title="Usuários" value={12} icon="👤" />
            <KpiCard title="Galpões" value={4} icon="🏢" />
            <KpiCard title="Vendas" value={128} icon="💰" />
          </section>

          {/* Gráficos ou tabelas */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#33CCCC' }}>Resumo de Atividades</h2>
            <div className="text-gray-500">Aqui você pode adicionar gráficos, tabelas ou relatórios.</div>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
} 