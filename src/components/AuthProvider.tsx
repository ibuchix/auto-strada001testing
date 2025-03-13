import { createContext, useContext, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { SessionContextProvider } from "@supabase/auth-helpers-react";

// Keep our existing auth context for components that directly use it
const AuthContext = createContext<{
  session: Session | null;
  isLoading: boolean;
}>({
  session: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Wrap everything with the SessionContextProvider from @supabase/auth-helpers-react
  // This makes the supabase client available via useSupabaseClient() hook
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthContext.Provider value={{ session, isLoading }}>
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
