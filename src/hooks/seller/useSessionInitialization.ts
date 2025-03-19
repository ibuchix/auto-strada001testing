
/**
 * Changes made:
 * - 2024-11-18: Created dedicated hook for session initialization
 * - 2024-11-18: Extracted from useSellerSession to improve maintainability
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
        const sellerStatus = await checkSellerRole(data.session);
        setIsSeller(sellerStatus);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing session:", error);
      setIsLoading(false);
    }
  }, [checkSellerRole]);

  /**
   * Handle auth state changes
   */
  const setupAuthListener = useCallback(() => {
    return supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      
      setSession(newSession);
      
      if (newSession) {
        const sellerStatus = await checkSellerRole(newSession);
        setIsSeller(sellerStatus);
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
