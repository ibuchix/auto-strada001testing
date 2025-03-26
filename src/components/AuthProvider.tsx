
/**
 * Updated: 2025-08-27
 * Added isSeller and refreshSellerStatus properties to AuthContext
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
  isSeller: boolean;
  refreshSellerStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  login: async () => ({ error: null }),
  logout: async () => {},
  signup: async () => ({ error: null }),
  loading: true,
  isAuthenticated: false,
  refreshSession: async () => {},
  isSeller: false,
  refreshSellerStatus: async () => false
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);

  // Initial session check
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user || null);
      
      // Check if user is a seller
      if (data.session?.user) {
        const isSeller = data.session.user.user_metadata?.role === 'seller';
        setIsSeller(isSeller);
      }
      
      setLoading(false);
    };

    getSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
        
        // Check if user is a seller
        if (newSession?.user) {
          const isSeller = newSession.user.user_metadata?.role === 'seller';
          setIsSeller(isSeller);
        } else {
          setIsSeller(false);
        }
        
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

  const refreshSellerStatus = async (): Promise<boolean> => {
    try {
      // Check if user is already signed in
      if (!session?.user?.id) return false;
      
      // Refresh the session first
      await refreshSession();
      
      // Check metadata first (fastest)
      if (session?.user?.user_metadata?.role === 'seller') {
        setIsSeller(true);
        return true;
      }
      
      // Try to check the database
      const { data: sellerData, error } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();
        
      if (error) {
        console.error("Error checking seller status:", error);
        return false;
      }
      
      const hasSellerRecord = !!sellerData;
      setIsSeller(hasSellerRecord);
      
      // Update user metadata if needed
      if (hasSellerRecord && !session.user.user_metadata?.role) {
        await supabase.auth.updateUser({
          data: { role: 'seller' }
        });
      }
      
      return hasSellerRecord;
    } catch (error) {
      console.error("Error refreshing seller status:", error);
      return false;
    }
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
        isSeller,
        refreshSellerStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
