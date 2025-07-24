'use client';

import { User, onAuthStateChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Role } from '@/constants/roles';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  userName: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  userName: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          // Buscar role do usuário no Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role as Role);
            setUserName(userData.name || null);
          } else {
            // Usuário autenticado mas sem documento no Firestore
            console.warn('User authenticated but no Firestore document found');
            setRole(null);
            setUserName(null);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
          setUserName(null);
        }
      } else {
        setRole(null);
        setUserName(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [mounted]);

  return (
    <AuthContext.Provider value={{ user, role, userName, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 