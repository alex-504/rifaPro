'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/providers/AuthProvider';

export default function WelcomePage() {
  const { user, role, userName } = useAuth();

  return (
    <ProtectedRoute allowedRoles={[ROLES.DRIVER, ROLES.WAREHOUSE_ADMIN]}>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">👋</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Bem-vindo ao RifaPro!
            </h1>
            <p className="text-gray-600">
              {userName ? (
                <>Olá, <strong className="text-blue-600">{userName}</strong>!</>
              ) : (
                <>Olá, <strong>{user?.email}</strong></>
              )}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-800 mb-2">Sua Função:</h2>
            <span className="inline-flex px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
              {role === ROLES.DRIVER ? 'Motorista' : 'Admin do Galpão'}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-gray-600 text-sm">
              Sua conta foi ativada com sucesso! 
            </p>
            
            {role === ROLES.DRIVER && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Como Motorista, você pode:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Visualizar suas viagens e notas</li>
                  <li>• Registrar vendas</li>
                  <li>• Gerenciar clientes finais</li>
                  <li>• Acompanhar remarques e brindes</li>
                </ul>
              </div>
            )}

            {role === ROLES.WAREHOUSE_ADMIN && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Como Admin do Galpão, você pode:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Gerenciar produtos do galpão</li>
                  <li>• Controlar estoque</li>
                  <li>• Criar notas de carregamento</li>
                  <li>• Acompanhar movimentações</li>
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-gray-500 mb-4">
              O app mobile e funcionalidades específicas estarão disponíveis em breve.
            </p>
            
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fazer Logout
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}