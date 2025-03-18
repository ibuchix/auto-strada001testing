
/**
 * Changes made:
 * - 2024-07-06: Enhanced session management with seller-specific checks
 * - 2024-07-06: Fixed supabase client initialization issue
 * - 2024-08-25: Refactored to properly use the updated useSellerSession hook
 * - 2024-08-25: Added refreshSellerStatus to context for re-checking seller status
 * - 2024-09-26: Added signOut method to AuthContext
 */

import { createContext, useContext } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { useSellerSession } from "@/hooks/useSellerSession";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  isSeller: boolean;
  refreshSellerStatus: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  isSeller: false,
  refreshSellerStatus: async () => false,
  signOut: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Use the refactored hook directly in the provider
  const { session, isLoading, isSeller, refreshSellerStatus } = useSellerSession();

  // Add signOut method
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthContext.Provider 
        value={{ 
          session, 
          isLoading, 
          isSeller,
          refreshSellerStatus,
          signOut
        }}
      >
        {children}
      </AuthContext.Provider>
    </SessionContextProvider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
