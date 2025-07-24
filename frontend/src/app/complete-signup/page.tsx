'use client';

import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FirestoreService } from '@/lib/firestore';
import { useRouter } from 'next/navigation';

export default function CompleteSignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      // Try to find user by email in Firestore
      // Note: This is a simplified approach - in production you'd want a more secure method
      let pendingUser = null;

      try {
        const users = await FirestoreService.getAllUsers();
        pendingUser = users.find(
          user => user.email === formData.email && user.status === 'pending'
        );
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Erro ao verificar usuário. Contate o administrador.');
        setLoading(false);
        return;
      }

      if (!pendingUser) {
        setError('Email não encontrado ou usuário já ativo. Contate o administrador.');
        setLoading(false);
        return;
      }

      // Try to create Firebase Auth account
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          setError('Este email já possui uma conta no sistema. Você pode: 1) Tentar fazer login diretamente, 2) Usar a página de reset de conta, ou 3) Contatar o administrador.');
          setLoading(false);
          return;
        } else {
          throw authError; // Re-throw other errors
        }
      }

      // Create new user document with Firebase Auth UID
      await FirestoreService.createUserWithId(userCredential.user.uid, {
        name: pendingUser.name,
        email: pendingUser.email,
        role: pendingUser.role,
        status: 'active',
        ...(pendingUser.clientId && { clientId: pendingUser.clientId }),
      });

      // Delete the old pending user document
      await FirestoreService.deleteDocument('users', pendingUser.id);

      alert('Conta ativada com sucesso! Você será redirecionado automaticamente.');

      // Aguardar um pouco para o AuthProvider processar o usuário
      setTimeout(() => {
        // O redirecionamento será feito automaticamente pela home page
        // baseado no role do usuário
        router.push('/');
      }, 1000);

    } catch (error: unknown) {
      console.error('Error completing signup:', error);

      const errorCode = (error as { code?: string })?.code;
      if (errorCode === 'auth/email-already-in-use') {
        setError(
          'Este email já possui uma conta no sistema. ' +
          'Se você esqueceu a senha, tente fazer login. ' +
          'Se a conta está com problemas, use a página de reset: /reset-account'
        );
      } else if (errorCode === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Erro ao ativar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Completar Cadastro
        </h1>

        <p className="text-gray-600 mb-6 text-center">
          Complete seu cadastro criando uma senha para sua conta.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Seu email"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              placeholder="Crie uma senha"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Senha
            </label>
            <input
              type="password"
              placeholder="Confirme sua senha"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Ativando conta...' : 'Ativar Conta'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <a href="/login" className="block text-blue-600 hover:text-blue-800 text-sm">
            Já tem uma conta ativa? Fazer login
          </a>
          <a href="/reset-account" className="block text-red-600 hover:text-red-800 text-sm">
            Problema com "email já em uso"? Resetar conta
          </a>
        </div>
      </div>
    </div>
  );
}