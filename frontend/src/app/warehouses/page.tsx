'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roles';
import { FirestoreService, Warehouse, User } from '@/lib/firestore';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/providers/AuthProvider';

export default function WarehousesPage() {
  const { role, user } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseAdmins, setWarehouseAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [creating, setCreating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    managerName: '',
    ownerId: '',
    ownerName: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    setMounted(true);
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const [warehousesData, adminsData] = await Promise.all([
        FirestoreService.getAllWarehouses(),
        FirestoreService.getUsersByRole(ROLES.WAREHOUSE_ADMIN)
      ]);
      setWarehouses(warehousesData);
      setWarehouseAdmins(adminsData);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      if (editingWarehouse) {
        // Update existing warehouse
        await FirestoreService.updateDocument('warehouses', editingWarehouse.id, formData);
        alert('Galpão atualizado com sucesso!');
      } else {
        // Create new warehouse
        await FirestoreService.createWarehouse({
          ...formData,
          createdBy: user?.uid || ''
        });
        alert('Galpão criado com sucesso!');
      }

      // Reset form and reload warehouses
      resetForm();
      loadWarehouses();
    } catch (error) {
      console.error('Error saving warehouse:', error);
      alert('Erro ao salvar galpão. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      phone: '',
      email: '',
      managerName: '',
      ownerId: '',
      ownerName: '',
      status: 'active',
    });
    setEditingWarehouse(null);
    setShowForm(false);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setFormData({
      name: warehouse.name,
      description: warehouse.description || '',
      address: warehouse.address,
      city: warehouse.city,
      state: warehouse.state,
      phone: warehouse.phone || '',
      email: warehouse.email || '',
      managerName: warehouse.managerName || '',
      ownerId: warehouse.ownerId || '',
      ownerName: warehouse.ownerName || '',
      status: warehouse.status,
    });
    setEditingWarehouse(warehouse);
    setShowForm(true);
  };

  // Check if user can edit this warehouse (with hydration protection)
  const canEditWarehouse = (warehouse: Warehouse) => {
    if (!mounted) return false; // Prevent hydration mismatch
    if (role === ROLES.APP_ADMIN) return true;
    if (role === ROLES.WAREHOUSE_ADMIN && user?.uid === warehouse.ownerId) return true;
    return false;
  };

  const handleStatusToggle = async (warehouse: Warehouse) => {
    try {
      const newStatus = warehouse.status === 'active' ? 'inactive' : 'active';
      
      if (newStatus === 'inactive') {
        const confirmMessage = `Tem certeza que deseja desativar o galpão "${warehouse.name}"?\n\nISSO TAMBÉM DESATIVARÁ TODOS OS PRODUTOS DESTE GALPÃO!`;
        if (!confirm(confirmMessage)) {
          return;
        }
      }
      
      // Use the new function that handles product cascade
      await FirestoreService.updateWarehouseStatus(warehouse.id, newStatus);
      loadWarehouses();
      
      const message = newStatus === 'active' 
        ? `Galpão ativado com sucesso!`
        : `Galpão e todos os seus produtos foram desativados com sucesso!`;
      alert(message);
    } catch (error) {
      console.error('Error updating warehouse status:', error);
      alert('Erro ao atualizar status do galpão.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN, ROLES.WAREHOUSE_ADMIN]}>
      <div className="min-h-screen flex bg-gray-100">
        <Sidebar />

        <main className="flex-1 p-8">
          {/* Header */}
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Galpões</h1>
              <p className="text-gray-600 mt-2">Gerencie os galpões independentes do sistema</p>
            </div>
            {(role === ROLES.APP_ADMIN || role === ROLES.WAREHOUSE_ADMIN) && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                {showForm ? 'Cancelar' : '+ Novo Galpão'}
              </button>
            )}
          </header>

          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-gray-200">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {editingWarehouse ? 'Editar Galpão' : 'Criar Novo Galpão'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome do Galpão *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Galpão Central"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dono do Galpão *
                  </label>
                  <select
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    value={formData.ownerId}
                    onChange={(e) => {
                      const selectedAdmin = warehouseAdmins.find(admin => admin.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        ownerId: e.target.value,
                        ownerName: selectedAdmin?.name || ''
                      });
                    }}
                    required
                  >
                    <option value="">Selecione o dono do galpão</option>
                    {warehouseAdmins.map(admin => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name} ({admin.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Responsável/Gerente *
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do responsável"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    placeholder="Descrição do galpão, especialidades, etc."
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Endereço *
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, número, bairro"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Lagoa da Prata"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estado *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: MG"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    placeholder="(31) 99999-9999"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="contato@galpao.com"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  >
                    <option value="active">🟢 Ativo</option>
                    <option value="inactive">🔴 Inativo</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-lg"
                  >
                    {creating ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        {editingWarehouse ? 'Atualizando...' : 'Criando galpão...'}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>✨</span>
                        {editingWarehouse ? 'Atualizar Galpão' : 'Criar Galpão'}
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Warehouses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouses.map((warehouse) => (
              <div key={warehouse.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{warehouse.name}</h3>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      warehouse.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {warehouse.status === 'active' ? '🟢 Ativo' : '🔴 Inativo'}
                    </span>
                  </div>

                  {warehouse.description && (
                    <p className="text-gray-800 text-sm mb-4">{warehouse.description}</p>
                  )}

                  <div className="space-y-2 text-sm">
                    {warehouse.ownerName && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">👑</span>
                        <span className="font-medium text-blue-600">Dono: {warehouse.ownerName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">👤</span>
                      <span className="font-medium text-gray-800">Gerente: {warehouse.managerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">📍</span>
                      <span className="text-gray-800">{warehouse.city}, {warehouse.state}</span>
                    </div>
                    {warehouse.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">📞</span>
                        <span className="text-gray-800">{warehouse.phone}</span>
                      </div>
                    )}
                    {warehouse.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">📧</span>
                        <span className="text-gray-800">{warehouse.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex flex-col gap-2">
                      {/* View Products Button - Available for all roles */}
                      <a
                        href={`/warehouses/${warehouse.id}/products`}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium text-center"
                      >
                        📦 Ver Produtos
                      </a>
                      
                      {/* Admin Actions - Only show if user can edit this warehouse */}
                      {canEditWarehouse(warehouse) && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(warehouse)}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleStatusToggle(warehouse)}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                              warehouse.status === 'active'
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {warehouse.status === 'active' ? '🔴 Desativar' : '🟢 Ativar'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {warehouses.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏭</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum galpão cadastrado</h3>
              <p className="text-gray-600 mb-6">Comece criando seu primeiro galpão no sistema</p>
              {(role === ROLES.APP_ADMIN || role === ROLES.WAREHOUSE_ADMIN) && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  + Criar Primeiro Galpão
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}