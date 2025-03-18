
/**
 * Changes made:
 * - 2024-07-06: Created hook for seller-specific session management
 * - 2024-07-06: Updated to not force redirect on public pages
 * - 2024-07-06: Fixed issues with supabase client initialization
 */

import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useSellerSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize session
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        if (data.session) {
          await checkSellerRole(data.session);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching session:", error);
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await checkSellerRole(session);
      } else {
        setIsSeller(false);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const checkSellerRole = async (session: Session) => {
    try {
      // Check user metadata first (faster)
      if (session.user.user_metadata?.role === 'seller') {
        setIsSeller(true);
        return;
      }

      // If not in metadata, check profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error checking seller role:', error);
        return;
      }

      setIsSeller(profile?.role === 'seller');
    } catch (error) {
      console.error('Error checking seller role:', error);
    }
  };

  return {
    session,
    isLoading,
    isSeller,
  };
};
