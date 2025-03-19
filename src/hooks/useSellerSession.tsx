
/**
 * Changes made:
 * - 2024-07-06: Created hook for seller-specific session management
 * - 2024-07-06: Updated to not force redirect on public pages
 * - 2024-07-06: Fixed issues with supabase client initialization
 * - 2024-08-25: Refactored for improved performance and better error handling
 * - 2024-08-25: Added more reliable seller role detection with caching optimization
 * - 2024-11-14: Enhanced seller role checking to handle RLS permission issues
 * - 2024-11-14: Added fallback mechanisms for seller verification when database queries fail
 * - 2024-11-15: Improved error handling for profile access with multiple fallback methods
 * - 2024-11-16: Added support for row level security policies and improved authentication flow
 * - 2024-11-18: Refactored into smaller hooks for better maintainability
 */

import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionInitialization } from "./seller/useSessionInitialization";
import { useSellerRoleCheck } from "./seller/useSellerRoleCheck";

export const useSellerSession = () => {
  const navigate = useNavigate();
  const { checkSellerRole } = useSellerRoleCheck();
  const {
    session,
    isLoading,
    isSeller,
    setIsLoading,
    setIsSeller,
    initializeSession,
    setupAuthListener
  } = useSessionInitialization();

  useEffect(() => {
    let mounted = true;
    
    // Initialize session state
    if (mounted) {
      initializeSession();
    }

    // Set up subscription to auth state changes
    const subscription = setupAuthListener();

    // Cleanup function
    return () => {
      mounted = false;
      subscription.data.subscription.unsubscribe();
    };
  }, [navigate, initializeSession, setupAuthListener]);

  /**
   * Force refresh seller status - useful after registration or role changes
   */
  const refreshSellerStatus = useCallback(async () => {
    if (!session) return false;
    
    setIsLoading(true);
    const result = await checkSellerRole(session);
    setIsSeller(result);
    setIsLoading(false);
    return result;
  }, [session, checkSellerRole, setIsLoading, setIsSeller]);

  return {
    session,
    isLoading,
    isSeller,
    refreshSellerStatus
  };
};
