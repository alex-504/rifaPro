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
  clientId: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  userName: null,
  clientId: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
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
          // Buscar role do usuário no Firestore com retry para casos de onboarding
          let userDoc;
          let attempts = 0;
          const maxAttempts = 3;
          
          do {
            userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists() && attempts < maxAttempts - 1) {
              // Wait 1 second before retry (for onboarding cases)
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            attempts++;
          } while (!userDoc.exists() && attempts < maxAttempts);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('🔍 AuthProvider - User data loaded:', { role: userData.role, clientId: userData.clientId, name: userData.name });
            
            // Create enhanced user object with Firestore data
            const enhancedUser = {
              ...user,
              clientId: userData.clientId,
              role: userData.role,
              name: userData.name
            };
            
            setUser(enhancedUser);
            setRole(userData.role as Role);
            setUserName(userData.name || null);
            setClientId(userData.clientId || null);
          } else {
            // Usuário autenticado mas sem documento no Firestore
            console.warn('User authenticated but no Firestore document found');
            setRole(null);
            setUserName(null);
            setClientId(null);
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
    <AuthContext.Provider value={{ user, role, userName, clientId, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 