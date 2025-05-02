
/**
 * Changes made:
 * - 2024-11-18: Created dedicated hook for session initialization
 * - 2024-11-18: Extracted from useSellerSession to improve maintainability
 * - 2025-07-14: Updated to trust metadata for seller status without verification
 * - 2025-05-02: Enhanced session initialization with token refresh and expiration handling
 * - 2025-05-06: Fixed circular dependencies and infinite re-render loops
 * - 2025-05-06: Simplified session initialization and added guards to prevent cascading updates
 */

import { useState, useEffect, useCallback, useRef } from "react";
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
  
  // Use refs to track initialization state and prevent re-renders
  const initializingRef = useRef(false);
  const sessionCheckedRef = useRef(false);
  const authListenerRef = useRef<{subscription: {unsubscribe: () => void}} | null>(null);

  /**
   * Initialize session and check seller status
   * Trust metadata primarily and only falls back to database checks
   */
  const initializeSession = useCallback(async () => {
    // Prevent concurrent initialization
    if (initializingRef.current) return;
    
    try {
      console.log("Session initialization: Starting...");
      initializingRef.current = true;
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session initialization: Error getting session", error);
        setIsLoading(false);
        initializingRef.current = false;
        return;
      }
      
      if (!data.session) {
        console.log("Session initialization: No session found");
        setSession(null);
        setIsSeller(false);
        setIsLoading(false);
        initializingRef.current = false;
        return;
      }
      
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
          handleSessionUpdate(data.session);
        } else if (refreshData.session) {
          // Use the new refreshed session
          console.log("Session initialization: Token refreshed successfully");
          handleSessionUpdate(refreshData.session);
        }
      } else {
        // Use existing session since it's not about to expire
        handleSessionUpdate(data.session);
      }
      
      sessionCheckedRef.current = true;
    } catch (error) {
      console.error("Error initializing session:", error);
    } finally {
      setIsLoading(false);
      initializingRef.current = false;
    }
  }, []);

  /**
   * Handle session update with optimized role checking
   */
  const handleSessionUpdate = useCallback((newSession: Session | null) => {
    console.log("handleSessionUpdate:", newSession ? "session present" : "no session");
    
    // Set the session state
    setSession(newSession);
    
    // If no session, ensure seller state is false
    if (!newSession) {
      setIsSeller(false);
      return;
    }
    
    // Trust metadata first if available
    if (newSession.user?.user_metadata?.role === 'seller') {
      console.log("Session update: User is seller based on metadata");
      setIsSeller(true);
    } else {
      // Fallback to more intensive database check only if necessary
      checkSellerRole(newSession).then(sellerStatus => {
        // Only update if value is different to prevent loops
        if (sellerStatus !== isSeller) {
          setIsSeller(sellerStatus);
        }
      });
    }
  }, [checkSellerRole, isSeller]);

  /**
   * Set up auth state change listener
   */
  const setupAuthListener = useCallback(() => {
    // Clean up previous listener if exists
    if (authListenerRef.current) {
      authListenerRef.current.subscription.unsubscribe();
    }
    
    console.log("Setting up auth state change listener");
    
    // Set up new listener
    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed:', event);
      
      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in');
          handleSessionUpdate(newSession);
          break;
        case 'SIGNED_OUT':
          console.log('User signed out');
          handleSessionUpdate(null);
          break;
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed');
          handleSessionUpdate(newSession);
          break;
        case 'USER_UPDATED':
          console.log('User updated');
          handleSessionUpdate(newSession);
          break;
      }
    });
    
    // Store the auth listener
    authListenerRef.current = data;
    
    return data;
  }, [handleSessionUpdate]);

  return {
    session,
    setSession,
    isLoading,
    setIsLoading,
    isSeller,
    setIsSeller,
    initializeSession,
    setupAuthListener,
    sessionChecked: sessionCheckedRef.current
  };
};
