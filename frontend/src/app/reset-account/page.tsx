'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FirestoreService } from '@/lib/firestore';

export default function ResetAccountPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Tentar fazer login com as credenciais
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Deletar a conta do Firebase Auth
      await deleteUser(userCredential.user);
      
      // Tentar deletar o documento do Firestore (se existir)
      try {
        await FirestoreService.deleteDocument('users', userCredential.user.uid);
      } catch {
        console.log('Documento não encontrado no Firestore (normal)');
      }

      setMessage('Conta resetada com sucesso! Agora você pode criar uma nova conta com este email.');
      setEmail('');
      setPassword('');
      
    } catch (error: unknown) {
      console.error('Error resetting account:', error);
      
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === 'auth/user-not-found') {
        setError('Usuário não encontrado. Talvez a conta já tenha sido deletada.');
      } else if (errorCode === 'auth/wrong-password') {
        setError('Senha incorreta. Digite a senha atual da conta.');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Email inválido.');
      } else {
        setError('Erro ao resetar conta. Tente novamente ou contate o administrador.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Resetar Conta
        </h1>
        
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
          <p className="text-sm">
            <strong>⚠️ Atenção:</strong> Esta página deleta completamente uma conta existente. 
            Use apenas se você recebeu o erro &quot;email já em uso&quot; e tem certeza de que quer resetar.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email da conta a ser resetada
            </label>
            <input
              type="email"
              placeholder="email@exemplo.com"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha atual da conta
            </label>
            <input
              type="password"
              placeholder="Senha atual"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Resetando conta...' : 'Resetar Conta'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <a href="/complete-signup" className="block text-blue-600 hover:text-blue-800 text-sm">
            Voltar para completar cadastro
          </a>
          <a href="/login" className="block text-gray-600 hover:text-gray-800 text-sm">
            Ir para login
          </a>
        </div>
      </div>
    </div>
  );
}