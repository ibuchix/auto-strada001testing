
/**
 * Auth Provider Component
 * Updated: 2025-05-08 - Added userId storage in localStorage for cross-component access
 * Updated: 2025-05-08 - Added isSeller and refreshSellerStatus to AuthContextType interface
 * Updated: 2025-05-23 - Fixed circular dependency issue with useSellerSession
 */

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useSellerRoleCheck } from "@/hooks/seller/useSellerRoleCheck";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  isSeller: boolean;
  refreshSellerStatus: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  
  // Use the useSellerRoleCheck hook to get the checkSellerRole function
  const { checkSellerRole } = useSellerRoleCheck();

  // Initialize seller status when session changes
  useEffect(() => {
    if (session) {
      checkSellerRole(session).then(sellerStatus => {
        setIsSeller(sellerStatus);
      });
    } else {
      setIsSeller(false);
    }
  }, [session, checkSellerRole]);

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

  // Function to refresh seller status
  const refreshSellerStatus = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsSeller(false);
        return false;
      }
      
      const sellerStatus = await checkSellerRole(session);
      setIsSeller(sellerStatus);
      return sellerStatus;
    } catch (error: any) {
      console.error("Error refreshing seller status:", error);
      return false;
    }
  }, [checkSellerRole]);

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
    <AuthContext.Provider value={{ 
      session, 
      isLoading, 
      error, 
      signOut, 
      isSeller, 
      refreshSellerStatus 
    }}>
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
