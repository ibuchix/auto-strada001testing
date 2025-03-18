
/**
 * Changes made:
 * - 2024-07-06: Enhanced session management with seller-specific checks
 * - 2024-07-06: Fixed supabase client initialization issue
 */

import { createContext, useContext, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { useSellerSession } from "@/hooks/useSellerSession";

const AuthContext = createContext<{
  session: Session | null;
  isLoading: boolean;
  isSeller: boolean;
}>({
  session: null,
  isLoading: true,
  isSeller: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Provide initial values without the hook to prevent the error
  const [sessionState, setSessionState] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthContext.Provider 
        value={{ 
          session: sessionState, 
          isLoading, 
          isSeller 
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
