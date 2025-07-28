'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roles';
import { FirestoreService, DriverAssignment, DriverAvailability, User, Client } from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/providers/AuthProvider';

export default function DriversPage() {
  const { role, user, clientId } = useAuth();
  const [assignments, setAssignments] = useState<DriverAssignment[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<DriverAssignment | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [driverAvailability, setDriverAvailability] = useState<DriverAvailability | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    clientId: role === ROLES.CLIENT_ADMIN && clientId ? clientId : '',
    commissionRate: 5.0,
    status: 'active' as 'active' | 'inactive',
  });

  const loadData = useCallback(async () => {
    try {
      console.log('🔍 LoadData Debug:');
      console.log('- Role:', role);
      console.log('- ClientId:', clientId);
      
      const [assignmentsData, availableDriversData, clientsData] = await Promise.all([
        role === ROLES.CLIENT_ADMIN && clientId
          ? FirestoreService.getDriverAssignmentsByClient(clientId)
          : FirestoreService.getAllDriverAssignments(),
        FirestoreService.getAvailableDrivers(),
        role === ROLES.CLIENT_ADMIN && clientId
          ? Promise.resolve([]).then(async () => {
              const allClients = await FirestoreService.getAllClients();
              return allClients.filter(c => c.id === clientId);
            })
          : FirestoreService.getAllClients()
      ]);

      console.log('📊 Assignments loaded:', assignmentsData.length);
      console.log('📊 Available drivers:', availableDriversData.length);

      setAssignments(assignmentsData);
      setAvailableDrivers(availableDriversData);
      setClients(clientsData.filter(c => c.status === 'active'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [role, clientId]);

  useEffect(() => {
    // Only load data when we have complete user information
    if (role && (role !== ROLES.CLIENT_ADMIN || clientId)) {
      loadData();
    }
  }, [role, clientId, loadData]);

  // Handle driver selection and load availability info
  const handleDriverSelection = async (userId: string) => {
    setSelectedDriverId(userId);
    setFormData({ ...formData, userId });
    
    if (userId) {
      try {
        const availability = await FirestoreService.getDriverAvailability(userId);
        setDriverAvailability(availability);
      } catch (error) {
        console.error('Error loading driver availability:', error);
        setDriverAvailability(null);
      }
    } else {
      setDriverAvailability(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      if (editingAssignment) {
        // Update existing assignment
        await FirestoreService.updateDriverAssignment(editingAssignment.id, {
          commissionRate: formData.commissionRate,
          status: formData.status,
        });
        alert('Contrato de motorista atualizado com sucesso!');
      } else {
        // Create new driver assignment
        const assignmentData = {
          userId: formData.userId,
          clientId: formData.clientId,
          commissionRate: formData.commissionRate,
          status: formData.status,
          assignedAt: Timestamp.now(),
          assignedBy: user?.uid || ''
        };
        
        console.log('🔍 Creating driver assignment with data:', assignmentData);
        await FirestoreService.createDriverAssignment(assignmentData);
        console.log('✅ Driver assignment created successfully');
        alert('Motorista contratado com sucesso!');
      }

      resetForm();
      console.log('🔄 Reloading assignments data...');
      
      // Small delay to ensure Firestore has synced
      setTimeout(() => {
        loadData();
      }, 1000);
    } catch (error) {
      console.error('Error saving driver assignment:', error);
      alert('Erro ao contratar motorista. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      clientId: role === ROLES.CLIENT_ADMIN && clientId ? clientId : '',
      commissionRate: 5.0,
      status: 'active',
    });
    setEditingAssignment(null);
    setSelectedDriverId('');
    setDriverAvailability(null);
    setShowForm(false);
  };

  const handleEdit = (assignment: DriverAssignment) => {
    setFormData({
      userId: assignment.userId,
      clientId: assignment.clientId,
      commissionRate: assignment.commissionRate,
      status: assignment.status,
    });
    setEditingAssignment(assignment);
    setSelectedDriverId(assignment.userId);
    
    // Load driver availability for editing
    handleDriverSelection(assignment.userId);
    setShowForm(true);
  };

  const handleStatusToggle = async (assignment: DriverAssignment) => {
    try {
      const newStatus = assignment.status === 'active' ? 'inactive' : 'active';
      
      // Optimistic update
      setAssignments(prevAssignments => 
        prevAssignments.map(a => 
          a.id === assignment.id ? { ...a, status: newStatus } : a
        )
      );
      
      await FirestoreService.updateDriverAssignment(assignment.id, { status: newStatus });
      alert(`Contrato ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      console.error('Error updating assignment status:', error);
      // Revert optimistic update
      setAssignments(prevAssignments => 
        prevAssignments.map(a => 
          a.id === assignment.id ? { ...a, status: assignment.status } : a
        )
      );
      alert('Erro ao atualizar status do contrato.');
    }
  };

  const handleDelete = async (assignment: DriverAssignment, driverName: string) => {
    if (confirm(`Tem certeza que deseja cancelar o contrato com "${driverName}"?\n\nEsta ação não pode ser desfeita!`)) {
      try {
        await FirestoreService.deleteDriverAssignment(assignment.id);
        loadData();
        alert('Contrato cancelado com sucesso!');
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert('Erro ao cancelar contrato.');
      }
    }
  };

  const getDriverByUserId = (userId: string) => {
    return availableDrivers.find(d => d.id === userId);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };

  const getAvailableDriversForSelection = () => {
    // For editing, include the currently selected driver
    if (editingAssignment) {
      return availableDrivers;
    }
    // For new assignments, show all available drivers
    return availableDrivers;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN]}>
      <div className="min-h-screen flex bg-gray-100">
        <Sidebar />

        <main className="flex-1 p-8">
          {/* Header */}
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Motoristas</h1>
              <p className="text-gray-600 mt-2">
                Gerencie os motoristas e suas informações
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              {showForm ? 'Cancelar' : '+ Novo Motorista'}
            </button>
          </header>

          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-gray-200">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {editingAssignment ? 'Editar Contrato de Motorista' : 'Contratar Motorista'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Selecionar Motorista *
                  </label>
                  <select
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    value={selectedDriverId}
                    onChange={(e) => handleDriverSelection(e.target.value)}
                    required
                    disabled={!!editingAssignment}
                  >
                    <option value="">Selecione um motorista</option>
                    {getAvailableDriversForSelection().map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} - {driver.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Driver Information Display */}
                {driverAvailability && (
                  <div className="bg-gray-50 rounded-lg p-6 border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      👤 Informações do Motorista
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Nome:</span>
                        <span className="ml-2 text-gray-900">{driverAvailability.user.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Email:</span>
                        <span className="ml-2 text-gray-900">{driverAvailability.user.email}</span>
                      </div>
                      {driverAvailability.user.phone && (
                        <div>
                          <span className="font-medium text-gray-700">Telefone:</span>
                          <span className="ml-2 text-gray-900">{driverAvailability.user.phone}</span>
                        </div>
                      )}
                      {driverAvailability.user.cpf && (
                        <div>
                          <span className="font-medium text-gray-700">CPF:</span>
                          <span className="ml-2 text-gray-900">{driverAvailability.user.cpf}</span>
                        </div>
                      )}
                      {driverAvailability.user.cnh && (
                        <div>
                          <span className="font-medium text-gray-700">CNH:</span>
                          <span className="ml-2 text-gray-900">{driverAvailability.user.cnh}</span>
                        </div>
                      )}
                      {driverAvailability.user.city && driverAvailability.user.state && (
                        <div>
                          <span className="font-medium text-gray-700">Localização:</span>
                          <span className="ml-2 text-gray-900">{driverAvailability.user.city}, {driverAvailability.user.state}</span>
                        </div>
                      )}
                    </div>

                    {/* Availability Status */}
                    <div className={`mt-4 p-4 rounded-lg border ${
                      driverAvailability.isAvailable 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      {driverAvailability.isAvailable ? (
                        <div className="text-green-800">
                          <div className="flex items-center gap-2 font-medium">
                            <span>✅</span>
                            <span>Motorista disponível para contratação</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-yellow-800">
                          <div className="flex items-center gap-2 font-medium mb-2">
                            <span>⚠️</span>
                            <span>Este motorista já trabalha para outros clientes:</span>
                          </div>
                          <ul className="ml-6 space-y-1">
                            {driverAvailability.currentClients.map((client, index) => (
                              <li key={index} className="text-sm">• {client}</li>
                            ))}
                          </ul>
                          <p className="mt-2 text-sm">
                            Você ainda pode contratá-lo. Ele atenderá múltiplos clientes.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {role === ROLES.APP_ADMIN ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cliente *
                    </label>
                    <select
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      value={formData.clientId}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      required
                    >
                      <option value="">Selecione um cliente</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name} - {client.city}, {client.state}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Seu Cliente
                    </label>
                    <div className="w-full p-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      {clients.length > 0 ? (
                        `${clients[0].name} - ${clients[0].city}, ${clients[0].state}`
                      ) : (
                        'Carregando...'
                      )}
                    </div>
                  </div>
                )}

                {/* Contract Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Taxa de Comissão (%) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="5.0"
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status do Contrato
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
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={creating || !selectedDriverId}
                    className="w-full bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-lg"
                  >
                    {creating ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        {editingAssignment ? 'Atualizando contrato...' : 'Contratando motorista...'}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>✨</span>
                        {editingAssignment ? 'Atualizar Contrato' : 'Contratar Motorista'}
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Drivers List */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motorista
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documentos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localização
                    </th>
                    {role === ROLES.APP_ADMIN && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comissão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment) => {
                    const driver = getDriverByUserId(assignment.userId);
                    if (!driver) return null;
                    
                    return (
                      <tr key={assignment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                            <div className="text-sm text-gray-500">{driver.email}</div>
                            <div className="text-sm text-gray-500">{driver.phone || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">CPF: {driver.cpf || 'N/A'}</div>
                          <div className="text-sm text-gray-500">CNH: {driver.cnh || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {driver.city && driver.state ? `${driver.city}, ${driver.state}` : 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">{driver.address || 'N/A'}</div>
                        </td>
                        {role === ROLES.APP_ADMIN && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{getClientName(assignment.clientId)}</div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">{assignment.commissionRate}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            assignment.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {assignment.status === 'active' ? '🟢 Ativo' : '🔴 Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(assignment)}
                              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleStatusToggle(assignment)}
                              className={`px-3 py-1 rounded text-xs ${
                                assignment.status === 'active'
                                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {assignment.status === 'active' ? '⏸️ Desativar' : '▶️ Ativar'}
                            </button>
                            <button
                              onClick={() => handleDelete(assignment, driver.name)}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-xs"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {assignments.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">Nenhum motorista encontrado</div>
              <p className="text-gray-400 mt-2">Clique em &quot;Novo Motorista&quot; para começar</p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
} 