import Logo from '@/components/Logo';
import { ReactNode } from 'react';
import Link from 'next/link';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/users', label: 'Usuários' },
  { href: '/warehouses', label: 'Galpões' },
  { href: '/products', label: 'Produtos' },
  { href: '/sales', label: 'Vendas' },
  { href: '/end-clients', label: 'Clientes Finais' },
  { href: '/drivers', label: 'Motoristas' },
];

export default function DashboardLayout({ children, title = 'Dashboard' }: { children: ReactNode; title?: string }) {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block">
        <Logo />
        <nav className="flex flex-col gap-4">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-700 hover:text-[#33CCCC] font-medium transition-colors pl-3"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Header */}
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold" style={{ color: '#33CCCC' }}>{title}</h1>
        </header>
        {children}
      </main>
    </div>
  );
} 