
/**
 * Changes made:
 * - 2024-11-18: Created dedicated hook for session initialization
 * - 2024-11-18: Extracted from useSellerSession to improve maintainability
 * - 2025-07-14: Updated to trust metadata for seller status without verification
 * - 2025-05-02: Enhanced session initialization with token refresh and expiration handling
 */

import { useState, useEffect, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useSellerRoleCheck } from "./useSellerRoleCheck";
import { toast } from "sonner";

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
        // Check session expiration
        const expiresAt = new Date((data.session.expires_at || 0) * 1000);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        
        // If token is close to expiring, refresh it
        if (timeUntilExpiry <= 10 * 60 * 1000) { // 10 minutes
          console.log("Session initialization: Token close to expiry, refreshing");
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.warn("Failed to refresh token during initialization:", refreshError);
            // Continue with the existing session
            setSession(data.session);
          } else if (refreshData.session) {
            // Use the new refreshed session
            console.log("Session initialization: Token refreshed successfully");
            setSession(refreshData.session);
            
            // Trust metadata first if available
            if (refreshData.session.user?.user_metadata?.role === 'seller') {
              console.log("Session initialization: User is seller based on metadata");
              setIsSeller(true);
            } else {
              // Fall back to database check only if metadata doesn't confirm
              const sellerStatus = await checkSellerRole(refreshData.session);
              setIsSeller(sellerStatus);
            }
          }
        } else {
          // Use existing session since it's not about to expire
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
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing session:", error);
      setIsLoading(false);
    }
  }, [checkSellerRole]);

  /**
   * Handle auth state changes
   * Updated to immediately trust metadata for seller status and handle session expiration
   */
  const setupAuthListener = useCallback(() => {
    return supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      
      // Handle token refresh events specifically
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed event received');
        if (newSession) {
          const expiresAt = new Date((newSession.expires_at || 0) * 1000);
          console.log('New token expires at:', expiresAt.toLocaleString());
        }
      }
      
      // Handle sign in
      if (event === 'SIGNED_IN' && newSession) {
        toast.success('You are now signed in', {
          id: 'auth-signed-in',
          duration: 3000
        });
      }
      
      // Handle sign out
      if (event === 'SIGNED_OUT') {
        toast.info('You have been signed out', {
          id: 'auth-signed-out',
          duration: 3000
        });
      }
      
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
