
/**
 * Changes made:
 * - 2024-07-06: Created hook for seller-specific session management
 */

import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const useSellerSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const supabase = useSupabaseClient();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkSellerRole(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      checkSellerRole(session);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const checkSellerRole = async (session: Session | null) => {
    if (!session) {
      setIsSeller(false);
      return;
    }

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

      // If not a seller, log them out and redirect
      if (profile?.role !== 'seller') {
        await supabase.auth.signOut();
        toast.error("Access denied. This application is for sellers only.");
        navigate('/auth');
      }
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
