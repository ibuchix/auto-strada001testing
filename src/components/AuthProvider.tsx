
/**
 * Changes made:
 * - 2024-07-06: Enhanced session management with seller-specific checks
 * - 2024-07-06: Fixed supabase client initialization issue
 * - 2024-08-25: Refactored to properly use the updated useSellerSession hook
 * - 2024-08-25: Added refreshSellerStatus to context for re-checking seller status
 * - 2024-10-15: Added offline mode awareness
 * - 2024-11-16: Updated to work with Row Level Security policies
 * - 2025-07-14: Enhanced metadata-based seller detection without verification
 */

import { createContext, useContext } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { useSellerSession } from "@/hooks/useSellerSession";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { getFromCache, saveToCache } from "@/services/offlineCacheService";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  isSeller: boolean;
  isOffline: boolean;
  refreshSellerStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  isSeller: false,
  isOffline: false,
  refreshSellerStatus: async () => false
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Use the refactored hook directly in the provider
  const { session, isLoading, isSeller, refreshSellerStatus } = useSellerSession();
  const { isOffline } = useOfflineStatus();
  
  // Cache the session when it changes (for offline use)
  if (session && !isOffline) {
    // Always indicate seller role in cache if metadata says so
    const role = session.user?.user_metadata?.role === 'seller' || isSeller ? 'seller' : 'buyer';
    
    saveToCache('userSession', {
      userId: session.user.id,
      email: session.user.email,
      role: role
    });
  }

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthContext.Provider 
        value={{ 
          session, 
          isLoading, 
          isSeller,
          isOffline,
          refreshSellerStatus
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
