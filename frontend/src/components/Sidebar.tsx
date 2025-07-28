'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import { ROLES } from '@/constants/roles';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  allowedRoles: string[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', allowedRoles: [ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN] },
  { name: 'Usuários', href: '/users', icon: '👤', allowedRoles: [ROLES.APP_ADMIN] },
  { name: 'Galpões', href: '/warehouses', icon: '🏭', allowedRoles: [ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN, ROLES.WAREHOUSE_ADMIN] },
  { name: 'Produtos', href: '/products', icon: '📦', allowedRoles: [ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN, ROLES.WAREHOUSE_ADMIN] },
  { name: 'Motoristas', href: '/drivers', icon: '🚛', allowedRoles: [ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN] },
  { name: 'Caminhões', href: '/trucks', icon: '🚚', allowedRoles: [ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN] },
  { name: 'Notas', href: '/notes', icon: '📋', allowedRoles: [ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN, ROLES.WAREHOUSE_ADMIN] },
  { name: 'Vendas', href: '/sales', icon: '💰', allowedRoles: [ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN] },
  { name: 'Clientes Finais', href: '/end-clients', icon: '👥', allowedRoles: [ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN] },
  { name: 'Relatórios', href: '/reports', icon: '📈', allowedRoles: [ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN] },
];

export default function Sidebar() {
  const { user, role, userName } = useAuth();
  const router = useRouter();

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    
    setLoggingOut(true);
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Erro ao fazer logout. Tente novamente.');
    } finally {
      setLoggingOut(false);
    }
  };

  const filteredNavItems = navItems.filter(item => 
    role && item.allowedRoles.includes(role)
  );

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6">
        <Logo />
      </div>
      
      <nav className="flex-1 px-6">
        <div className="space-y-2">
          {filteredNavItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </a>
          ))}
        </div>
      </nav>

      <div className="p-6 border-t">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
            {userName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {userName || user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-gray-700 capitalize">
              {role === 'app_admin' ? 'Admin do App' : 
               role === 'client_admin' ? 'Admin do Cliente' :
               role === 'driver' ? 'Motorista' :
               role === 'warehouse_admin' ? 'Admin do Galpão' : role}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{loggingOut ? '⏳' : '🚪'}</span>
          <span>{loggingOut ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </aside>
  );
}