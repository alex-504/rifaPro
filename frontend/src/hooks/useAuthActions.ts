import { useState } from 'react';
import { signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export function useAuthActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err: any) {
      let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado. Verifique o email.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta. Tente novamente.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'Conta desabilitada. Contate o administrador.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await signOut(auth);
      router.push('/login');
      return { success: true };
    } catch (err: any) {
      const errorMessage = 'Erro ao fazer logout. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    logout,
    loading,
    error,
    clearError: () => setError(null),
  };
}