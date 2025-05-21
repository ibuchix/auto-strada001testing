
/**
 * Auth Provider Component
 * Updated: 2025-05-08 - Added userId storage in localStorage for cross-component access
 * Updated: 2025-05-08 - Added isSeller and refreshSellerStatus to AuthContextType interface
 * Updated: 2025-05-23 - Fixed circular dependency issue with useSellerSession
 * Updated: 2025-06-20 - Enhanced error handling and fixed circular dependencies
 * Updated: 2025-06-21 - Fixed Hook invocation issue by ensuring all hooks are called unconditionally
 */

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useSellerRoleCheck } from "@/hooks/seller/useSellerRoleCheck";

// Define the AuthContextType with proper nullable types
interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  isSeller: boolean;
  refreshSellerStatus: () => Promise<boolean>;
}

// Create context with undefined as initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state hooks at the component level - never conditionally
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use the useSellerRoleCheck hook to get the checkSellerRole function
  const { checkSellerRole } = useSellerRoleCheck();

  // Initialize seller status when session changes
  useEffect(() => {
    if (!session) {
      setIsSeller(false);
      return;
    }
    
    checkSellerRole(session).then(sellerStatus => {
      setIsSeller(sellerStatus);
    }).catch(err => {
      console.error("Error checking seller role:", err);
      setIsSeller(false);
    });
  }, [session, checkSellerRole]);

  // Initialize auth session
  useEffect(() => {
    let mounted = true;
    
    async function getSession() {
      try {
        setIsLoading(true);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        // Only update state if component is still mounted
        if (mounted) {
          setSession(session);
          
          // Store userId in localStorage for easy access across components
          if (session?.user?.id) {
            localStorage.setItem('userId', session.user.id);
            console.log('User ID stored in localStorage:', session.user.id);
          } else {
            localStorage.removeItem('userId');
          }
          
          setIsInitialized(true);
        }
      } catch (error: any) {
        console.error("Error fetching session:", error);
        if (mounted) {
          setError(error);
          setIsInitialized(true);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    getSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        
        // Update userId in localStorage when auth state changes
        if (session?.user?.id) {
          localStorage.setItem('userId', session.user.id);
        } else {
          localStorage.removeItem('userId');
        }
      }
    });

    // Cleanup function to prevent memory leaks
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Function to refresh seller status
  const refreshSellerStatus = useCallback(async (): Promise<boolean> => {
    try {
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
  }, [checkSellerRole, session]);

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

  // Create a stable context value to prevent unnecessary re-renders
  const contextValue: AuthContextType = {
    session, 
    isLoading: isLoading || !isInitialized, 
    error, 
    signOut, 
    isSeller, 
    refreshSellerStatus 
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context with proper error handling
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
