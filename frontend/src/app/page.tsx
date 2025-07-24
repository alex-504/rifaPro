'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (user && role) {
        // Redirecionamento inteligente baseado no role
        if (role === 'app_admin' || role === 'client_admin') {
          router.push('/dashboard');
        } else if (role === 'driver' || role === 'warehouse_admin') {
          router.push('/welcome');
        } else {
          router.push('/login');
        }
      } else if (user && !role) {
        // Usuário autenticado mas sem role (problema de dados)
        console.warn('User authenticated but no role found');
        router.push('/login');
      } else {
        router.push('/login');
      }
    }
  }, [user, role, loading, router, mounted]);

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return null;
}
