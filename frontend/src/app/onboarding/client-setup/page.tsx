'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FirestoreService } from '@/lib/firestore';
import { ROLES } from '@/constants/roles';

function ClientSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const [step, setStep] = useState(1); // 1: Password, 2: Company Info
  const [loading, setLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);
  
  // Step 1: Password setup
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  // Step 2: Company info
  const [companyData, setCompanyData] = useState({
    companyName: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    contactName: '',
  });

  const checkUserStatus = async () => {
    try {
      const users = await FirestoreService.getAllUsers();
      const user = users.find(u => u.email === email);
      
      if (!user) {
        alert('Usuário não encontrado. Entre em contato com o suporte.');
        router.push('/');
        return;
      }

      if (user.role !== ROLES.CLIENT_ADMIN) {
        alert('Este link é apenas para clientes empresariais.');
        router.push('/');
        return;
      }

      if (user.status === 'active') {
        alert('Sua conta já está ativa. Faça login normalmente.');
        router.push('/');
        return;
      }

      setUserExists(true);
    } catch (error) {
      console.error('Error checking user status:', error);
      alert('Erro ao verificar status do usuário.');
    }
  };

  useEffect(() => {
    if (!email) {
      alert('Link inválido. Entre em contato com o suporte.');
      router.push('/');
      return;
    }

    // Check if user exists and is pending
    checkUserStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.password !== passwordData.confirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }

    if (passwordData.password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setStep(2);
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let firebaseUser;
      
      // Step 1: Try to create Firebase Auth user, or sign in if already exists
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          email!, 
          passwordData.password
        );
        firebaseUser = userCredential.user;
      } catch (authError: unknown) {
        const firebaseError = authError as { code?: string };
        if (firebaseError.code === 'auth/email-already-in-use') {
          // User already exists in Firebase Auth, try to sign in
          const signInCredential = await signInWithEmailAndPassword(
            auth,
            email!,
            passwordData.password
          );
          firebaseUser = signInCredential.user;
        } else {
          throw authError;
        }
      }

      // Step 2: Create Client record
      const clientId = await FirestoreService.createClient({
        name: companyData.companyName,
        address: companyData.address,
        city: companyData.city,
        state: companyData.state,
        phone: companyData.phone,
        status: 'active',
        createdBy: firebaseUser.uid,
      });

      // Step 3: Find and delete the temporary user document
      const users = await FirestoreService.getAllUsers();
      const tempUserDoc = users.find(u => u.email === email && u.isTemporary);
      
      if (tempUserDoc) {
        await FirestoreService.deleteDocument('users', tempUserDoc.id);
      }

      // Step 4: Create the real user document with Firebase Auth UID as document ID
      await FirestoreService.createUserWithId(firebaseUser.uid, {
        name: companyData.contactName,
        email: email!,
        role: ROLES.CLIENT_ADMIN,
        clientId: clientId,
        status: 'active',
        needsPasswordSetup: false,
      });

      console.log('✅ User document updated successfully');

      // Success!
      alert('Conta criada com sucesso! Bem-vindo ao sistema.');
      router.push('/dashboard');

    } catch (error: unknown) {
      console.error('Error creating account:', error);
      
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'auth/wrong-password') {
        alert('Senha incorreta. Tente novamente.');
      } else if (firebaseError.code === 'auth/user-not-found') {
        alert('Usuário não encontrado. Entre em contato com o suporte.');
      } else if (firebaseError.message?.includes('Missing or insufficient permissions')) {
        alert('Erro de permissão. Entre em contato com o suporte.');
      } else {
        alert('Erro ao criar conta. Tente novamente ou entre em contato com o suporte.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!userExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl text-white">🏢</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {step === 1 ? 'Criar sua Senha' : 'Dados da Empresa'}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === 1 
              ? 'Primeiro, vamos criar uma senha segura para sua conta'
              : 'Agora, cadastre os dados da sua empresa'
            }
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Step 1: Password */}
        {step === 1 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (confirmação)
              </label>
              <input
                type="email"
                value={email || ''}
                disabled
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha *
              </label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={passwordData.password}
                onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha *
              </label>
              <input
                type="password"
                placeholder="Digite a senha novamente"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Continuar →
            </button>
          </form>
        )}

        {/* Step 2: Company Info */}
        {step === 2 && (
          <form onSubmit={handleCompanySubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Empresa *
              </label>
              <input
                type="text"
                placeholder="Ex: Transportadora ABC Ltda"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={companyData.companyName}
                onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seu Nome (Responsável) *
              </label>
              <input
                type="text"
                placeholder="Ex: João Silva"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={companyData.contactName}
                onChange={(e) => setCompanyData({ ...companyData, contactName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade *
                </label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={companyData.city}
                  onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={companyData.state}
                  onChange={(e) => setCompanyData({ ...companyData, state: e.target.value })}
                  required
                >
                  <option value="">Selecione</option>
                  <option value="MG">MG</option>
                  <option value="SP">SP</option>
                  <option value="RJ">RJ</option>
                  <option value="BA">BA</option>
                  <option value="PE">PE</option>
                  <option value="CE">CE</option>
                  <option value="GO">GO</option>
                  <option value="PR">PR</option>
                  <option value="SC">SC</option>
                  <option value="RS">RS</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone *
              </label>
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={companyData.phone}
                onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço Completo *
              </label>
              <textarea
                placeholder="Rua, número, bairro, CEP"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                value={companyData.address}
                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                ← Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Criando...
                  </span>
                ) : (
                  'Finalizar Cadastro'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Precisa de ajuda? Entre em contato com o suporte
        </div>
      </div>
    </div>
  );
}

export default function ClientSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ClientSetupContent />
    </Suspense>
  );
}