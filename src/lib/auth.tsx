import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const ADMIN_SECRET = 'Ay123';
const STORAGE_KEY = 'rn_admin_session';

type AuthContextValue = {
  isAdmin: boolean;
  loading: boolean;
  loginWithCode: (code: string) => { error: string | null };
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') setIsAdmin(true);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  function loginWithCode(code: string) {
    if (code.trim() === ADMIN_SECRET) {
      setIsAdmin(true);
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // ignore
      }
      return { error: null };
    }
    return { error: 'Code secret incorrect.' };
  }

  function signOut() {
    setIsAdmin(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider value={{ isAdmin, loading, loginWithCode, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
