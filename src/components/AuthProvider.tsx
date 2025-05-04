
/**
 * Auth Provider Component
 * Updated: 2025-05-04 - Added userId storage in localStorage for cross-component access
 */

import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function getSession() {
      try {
        setIsLoading(true);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        setSession(session);
        
        // Store userId in localStorage for easy access across components
        if (session?.user?.id) {
          localStorage.setItem('userId', session.user.id);
          console.log('User ID stored in localStorage:', session.user.id);
        } else {
          localStorage.removeItem('userId');
        }
      } catch (error: any) {
        console.error("Error fetching session:", error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      // Update userId in localStorage when auth state changes
      if (session?.user?.id) {
        localStorage.setItem('userId', session.user.id);
      } else {
        localStorage.removeItem('userId');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Remove userId from localStorage on sign out
      localStorage.removeItem('userId');
    } catch (error: any) {
      console.error("Error signing out:", error);
      setError(error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
