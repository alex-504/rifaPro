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
                <h3 className="font-semibold text-green-800 mb-3">Como Admin do Galpão, você pode:</h3>
                <ul className="text-sm text-green-700 space-y-2">
                  <li>• 📦 Criar e editar produtos do seu galpão</li>
                  <li>• 📊 Controlar estoque e preços</li>
                  <li>• 📋 Aprovar notas dos caminhoneiros</li>
                  <li>• 👀 Ver produtos de outros galpões</li>
                  <li>• 📈 Acompanhar relatórios do galpão</li>
                </ul>
                
                <div className="mt-4 pt-3 border-t border-green-200">
                  <a
                    href="/dashboard"
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold text-center block"
                  >
                    🚀 Ir para Dashboard
                  </a>
                  
                  <div className="flex gap-2 mt-3">
                    <a
                      href="/products"
                      className="flex-1 bg-purple-100 text-purple-700 py-2 px-3 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium text-center"
                    >
                      📦 Meus Produtos
                    </a>
                    <a
                      href="/warehouses"
                      className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium text-center"
                    >
                      👀 Ver Outros Galpões
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-gray-700 mb-4">
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