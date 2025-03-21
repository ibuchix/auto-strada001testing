
/**
 * Changes made:
 * - 2024-11-18: Created dedicated hook for session initialization
 * - 2024-11-18: Extracted from useSellerSession to improve maintainability
 * - 2025-07-14: Updated to trust metadata for seller status without verification
 */

import { useState, useEffect, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useSellerRoleCheck } from "./useSellerRoleCheck";

/**
 * Hook for initializing and managing supabase session state
 */
export const useSessionInitialization = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const { checkSellerRole } = useSellerRoleCheck();

  /**
   * Initialize session and check seller status
   * Now trusts metadata primarily and only falls back to database checks
   */
  const initializeSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
        setSession(data.session);
        
        // Trust metadata first if available
        if (data.session.user?.user_metadata?.role === 'seller') {
          console.log("Session initialization: User is seller based on metadata");
          setIsSeller(true);
        } else {
          // Fall back to database check only if metadata doesn't confirm
          const sellerStatus = await checkSellerRole(data.session);
          setIsSeller(sellerStatus);
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing session:", error);
      setIsLoading(false);
    }
  }, [checkSellerRole]);

  /**
   * Handle auth state changes
   * Updated to immediately trust metadata for seller status
   */
  const setupAuthListener = useCallback(() => {
    return supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      
      setSession(newSession);
      
      if (newSession) {
        // Immediately check metadata for seller role
        if (newSession.user?.user_metadata?.role === 'seller') {
          console.log("Auth state change: User is seller based on metadata");
          setIsSeller(true);
        } else {
          // Only fall back to database check if metadata doesn't confirm
          const sellerStatus = await checkSellerRole(newSession);
          setIsSeller(sellerStatus);
        }
      } else {
        setIsSeller(false);
      }
      
      setIsLoading(false);
    });
  }, [checkSellerRole]);

  return {
    session,
    setSession,
    isLoading,
    setIsLoading,
    isSeller,
    setIsSeller,
    initializeSession,
    setupAuthListener
  };
};
