"use client";

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roles';
import Sidebar from '@/components/Sidebar';
import { FirestoreService } from '@/lib/firestore';
import { useAuth } from '@/providers/AuthProvider';

function KpiCard({ title, value, icon, loading }: { 
  title: string; 
  value: string | number; 
  icon?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
      {icon && <div className="text-3xl text-blue-600">{icon}</div>}
      <div>
        <div className="text-gray-700 text-sm">{title}</div>
        <div className="text-2xl font-bold">
          {loading ? (
            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
          ) : (
            value
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { userName, role, user, clientId } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    clients: 0,
    warehouses: 0,
    products: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
    try {
      if (role === ROLES.APP_ADMIN) {
        // App admin vê dados globais
        const [users, clients, warehouses, products] = await Promise.all([
          FirestoreService.getAllUsers(),
          FirestoreService.getAllClients(),
          FirestoreService.getAllWarehouses(),
          FirestoreService.getAllProducts(),
        ]);

        setStats({
          users: users.length,
          clients: clients.length,
          warehouses: warehouses.length,
          products: products.length,
        });
      } else if (role === ROLES.CLIENT_ADMIN && clientId) {
        // Client admin vê apenas dados da sua empresa
        const [drivers, warehouses, products] = await Promise.all([
          FirestoreService.getDriverAssignmentsByClient(clientId),
          FirestoreService.getAllWarehouses(), // Filtraremos depois
          FirestoreService.getAllProducts(), // Filtraremos depois
        ]);

        // Para client_admin, mostramos métricas relevantes para sua empresa
        setStats({
          users: drivers.length, // Seus motoristas
          clients: 1, // Sua empresa
          warehouses: warehouses.filter(w => w.status === 'active').length, // Galpões disponíveis
          products: products.filter(p => p.status === 'active').length, // Produtos disponíveis
        });
      } else if (role === ROLES.WAREHOUSE_ADMIN) {
        // Warehouse admin vê apenas dados do seu galpão
        const [warehouses, products] = await Promise.all([
          FirestoreService.getWarehousesByOwner(user?.uid || ''),
          FirestoreService.getAllProducts(),
        ]);

        const warehouseIds = warehouses.map(w => w.id);
        const myProducts = products.filter(p => warehouseIds.includes(p.warehouseId));

        setStats({
          users: 0,
          clients: 0,
          warehouses: warehouses.length,
          products: myProducts.length,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

    // Only load data when we have complete user information
    if (role && user && (role !== ROLES.CLIENT_ADMIN || clientId)) {
      loadStats();
    }
  }, [role, user, clientId]);

  return (
    <ProtectedRoute allowedRoles={[ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN, ROLES.WAREHOUSE_ADMIN]}>
      <div className="min-h-screen flex bg-gray-100">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-gray-600">
              {userName ? (
                <>Bem-vindo de volta, <span className="font-semibold text-blue-600">{userName}</span>!</>
              ) : (
                'Bem-vindo ao RifaPro'
              )}
            </p>
          </header>

          {/* KPIs - Different for each role */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {role === ROLES.WAREHOUSE_ADMIN ? (
              // Warehouse Admin sees only relevant metrics
              <>
                <KpiCard title="Meus Produtos" value={stats.products} icon="📦" loading={loading} />
                <KpiCard title="Estoque Total" value="0" icon="📊" loading={loading} />
                <KpiCard title="Notas Pendentes" value="0" icon="📋" loading={loading} />
                <KpiCard title="Vendas do Mês" value="R$ 0" icon="💰" loading={loading} />
              </>
            ) : (
              // App Admin and Client Admin see full metrics
              <>
                <KpiCard title="Usuários" value={stats.users} icon="👤" loading={loading} />
                <KpiCard title="Clientes" value={stats.clients} icon="🏢" loading={loading} />
                <KpiCard title="Galpões" value={stats.warehouses} icon="🏭" loading={loading} />
                <KpiCard title="Produtos" value={stats.products} icon="📦" loading={loading} />
              </>
            )}
          </section>

          {/* Quick Actions */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Ações Rápidas</h2>
              <div className="space-y-3">
                {role === ROLES.WAREHOUSE_ADMIN ? (
                  // Warehouse Admin specific actions
                  <>
                    <a href="/products" className="block p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📦</span>
                        <span className="font-medium">Gerenciar Meus Produtos</span>
                      </div>
                    </a>
                    <a href="/warehouses" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🏭</span>
                        <span className="font-medium">Ver Galpões</span>
                      </div>
                    </a>
                    <a href="/notes" className="block p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📋</span>
                        <span className="font-medium">Aprovar Notas</span>
                      </div>
                    </a>
                  </>
                ) : role === ROLES.APP_ADMIN ? (
                  // App Admin actions
                  <>
                    <a href="/users" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">👤</span>
                        <span className="font-medium">Gerenciar Usuários</span>
                      </div>
                    </a>
                    <a href="/products" className="block p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📦</span>
                        <span className="font-medium">Gerenciar Produtos</span>
                      </div>
                    </a>
                    <a href="/notes" className="block p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📋</span>
                        <span className="font-medium">Criar Nova Nota</span>
                      </div>
                    </a>
                  </>
                ) : (
                  // Client Admin actions
                  <>
                    <a href="/drivers" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🚛</span>
                        <span className="font-medium">Gerenciar Motoristas</span>
                      </div>
                    </a>
                    <a href="/products" className="block p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📦</span>
                        <span className="font-medium">Gerenciar Produtos</span>
                      </div>
                    </a>
                    <a href="/notes" className="block p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📋</span>
                        <span className="font-medium">Criar Nova Nota</span>
                      </div>
                    </a>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Atividade Recente</h2>
              <div className="text-gray-700 text-center py-8">
                <p>Nenhuma atividade recente</p>
                <p className="text-sm mt-2">As atividades aparecerão aqui conforme você usar o sistema</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
} 