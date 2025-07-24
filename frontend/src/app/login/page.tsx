"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Aguardar um pouco para o AuthProvider processar o usuário
      setTimeout(() => {
        // O redirecionamento será feito automaticamente pelo AuthProvider
        // baseado no role do usuário
        router.push("/");
      }, 500);
      
    } catch (err: unknown) {
      console.error('Login error:', err);
      
      // Tratamento específico de erros do Firebase
      const errorCode = (err as { code?: string })?.code;
      if (errorCode === 'auth/user-not-found') {
        setError('Usuário não encontrado. Verifique o email.');
      } else if (errorCode === 'auth/wrong-password') {
        setError('Senha incorreta. Tente novamente.');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Email inválido.');
      } else if (errorCode === 'auth/user-disabled') {
        setError('Conta desabilitada. Contate o administrador.');
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError('Erro ao fazer login. Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-2 border rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-2 border rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
} 