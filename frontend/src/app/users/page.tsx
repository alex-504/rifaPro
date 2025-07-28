'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ROLES, Role } from '@/constants/roles';
import { FirestoreService, User } from '@/lib/firestore';
// Imports removidos - não estamos usando Firebase Functions aqui

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ROLES.DRIVER as string,
    clientId: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await FirestoreService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      // Check for dependencies before deleting
      const dependencies = await checkUserDependencies(user);
      
      if (dependencies.length > 0) {
        const dependencyList = dependencies.join('\n• ');
        alert(`Não é possível excluir este usuário pois ele possui dependências:\n\n• ${dependencyList}\n\nRemova essas dependências primeiro ou desative o usuário.`);
        return;
      }

      if (confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?\n\nEsta ação não pode ser desfeita!\n\n${user.role === ROLES.CLIENT_ADMIN ? 'ATENÇÃO: Isso também deletará a empresa associada e a conta de login.' : ''}`)) {
        
        // For CLIENT_ADMIN, we need to delete related data
        if (user.role === ROLES.CLIENT_ADMIN && user.clientId) {
          console.log('🗑️ Deleting CLIENT_ADMIN and related data...');
          
          // Delete the client document
          await FirestoreService.deleteDocument('clients', user.clientId);
          console.log('✅ Client document deleted');
        }
        
        // Delete the user document
        await FirestoreService.deleteDocument('users', user.id);
        console.log('✅ User document deleted');
        
        // Note: Firebase Auth account deletion would require admin SDK
        // For now, we'll leave a note about manual cleanup
        
        alert(`Usuário excluído com sucesso!${user.role === ROLES.CLIENT_ADMIN ? '\n\nNOTA: A conta de login ainda existe no Firebase Auth e deve ser removida manualmente se necessário.' : ''}`);
        loadUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erro ao excluir usuário. Tente novamente.');
    }
  };

  const checkUserDependencies = async (user: User): Promise<string[]> => {
    const dependencies: string[] = [];

    try {
      // Check if user is a driver
      if (user.role === ROLES.DRIVER) {
        const drivers = await FirestoreService.getAllDrivers();
        const driverRecord = drivers.find(d => d.userId === user.id);
        if (driverRecord) {
          dependencies.push(`Registro de motorista ativo`);
          
          // Check if driver has trucks assigned
          const trucks = await FirestoreService.getAllTrucks();
          const assignedTrucks = trucks.filter(t => t.currentDriverId === driverRecord.id);
          if (assignedTrucks.length > 0) {
            dependencies.push(`${assignedTrucks.length} caminhão(ões) atribuído(s)`);
          }
        }
      }

      // Check if user is a client_admin with active client
      if (user.role === ROLES.CLIENT_ADMIN && user.clientId) {
        const drivers = await FirestoreService.getDriversByClient(user.clientId);
        if (drivers.length > 0) {
          dependencies.push(`${drivers.length} motorista(s) vinculado(s)`);
        }

        const trucks = await FirestoreService.getTrucksByClient(user.clientId);
        if (trucks.length > 0) {
          dependencies.push(`${trucks.length} caminhão(ões) vinculado(s)`);
        }
      }

      // Check if user is a warehouse_admin
      if (user.role === ROLES.WAREHOUSE_ADMIN) {
        const warehouses = await FirestoreService.getWarehousesByOwner(user.id);
        if (warehouses.length > 0) {
          dependencies.push(`${warehouses.length} galpão(ões) sob responsabilidade`);
        }
      }

    } catch (error) {
      console.error('Error checking dependencies:', error);
      dependencies.push('Erro ao verificar dependências - operação cancelada por segurança');
    }

    return dependencies;
  };

  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      // For now, let's use a simple approach that definitely won't affect your session
      // We'll create the user document directly in Firestore with a generated ID
      // and let them set their password on first login

      if (formData.role === ROLES.CLIENT_ADMIN) {
        // Para client_admin, criamos apenas um documento temporário para validação
        // O documento real será criado durante o onboarding com o UID correto
        const tempUserData = {
          name: formData.name,
          email: formData.email,
          role: formData.role as Role,
          status: 'pending' as const,
          needsPasswordSetup: true,
          isTemporary: true, // Flag para identificar que é temporário
        };
        await FirestoreService.createUser(tempUserData);
      } else {
        // Para outros roles, mantemos o comportamento atual
        const userData = {
          name: formData.name,
          email: formData.email,
          role: formData.role as Role,
          status: 'pending' as const,
          needsPasswordSetup: true,
          ...(formData.clientId.trim() && { clientId: formData.clientId }),
        };
        await FirestoreService.createUser(userData);
      }

      // Different success messages based on role
      if (formData.role === ROLES.CLIENT_ADMIN) {
        alert(`Cliente criado com sucesso!\n\nEnvie o link de onboarding para o cliente:\n\n${window.location.origin}/onboarding/client-setup?email=${encodeURIComponent(formData.email)}\n\nO cliente irá:\n1. Criar sua senha\n2. Cadastrar dados da empresa\n3. Começar a usar o sistema\n\nNOTA: O documento do usuário será criado automaticamente durante o onboarding com o UID correto do Firebase Auth.`);
      } else {
        alert(`Usuário criado com sucesso!\n\nInstrua o usuário a:\n1. Acessar: ${window.location.origin}/complete-signup\n2. Inserir o email: ${formData.email}\n3. Criar uma senha\n\nApós isso, eles poderão fazer login normalmente.`);
      }

      // Reset form and reload users
      setFormData({ name: '', email: '', role: ROLES.DRIVER, clientId: '' });
      setShowForm(false);
      loadUsers();

    } catch (error: unknown) {
      console.error('Error creating user:', error);
      alert('Erro ao criar usuário. Tente novamente.');
    } finally {
      setCreating(false);
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
    <ProtectedRoute allowedRoles={[ROLES.APP_ADMIN]}>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Usuários</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {showForm ? 'Cancelar' : 'Novo Usuário'}
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-gray-200">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Criar Novo Usuário</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Digite o nome completo"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="usuario@exemplo.com"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Função no Sistema
                  </label>
                  <select
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value={ROLES.APP_ADMIN}>🔧 Admin do App</option>
                    <option value={ROLES.CLIENT_ADMIN}>🏢 Admin do Cliente</option>
                    <option value={ROLES.DRIVER}>🚛 Motorista</option>
                    <option value={ROLES.WAREHOUSE_ADMIN}>🏭 Admin do Galpão</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ID do Cliente (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Deixe em branco se não aplicável"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  />
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
                        Criando usuário...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>✨</span>
                        Criar Usuário
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Função
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : user.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                        {user.status === 'pending' ? '⏳ Aguardando ativação' : user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.createdAt?.toDate().toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1 rounded"
                        title={`Excluir usuário ${user.name}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-700">
                Nenhum usuário encontrado
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}