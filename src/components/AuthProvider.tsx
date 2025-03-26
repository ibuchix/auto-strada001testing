
/**
 * Created: 2025-08-26
 * Stub AuthProvider component to fix build errors
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  login: (email: string, password: string) => Promise<{ 
    error: AuthError | null
  }>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, metadata?: any) => Promise<{
    error: AuthError | null
  }>;
  loading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  login: async () => ({ error: null }),
  logout: async () => {},
  signup: async () => ({ error: null }),
  loading: true,
  isAuthenticated: false,
  refreshSession: async () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial session check
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user || null);
      setLoading(false);
    };

    getSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signup = async (email: string, password: string, metadata?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const refreshSession = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setUser(data.session?.user || null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        login,
        logout,
        signup,
        loading,
        isAuthenticated: !!session,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
