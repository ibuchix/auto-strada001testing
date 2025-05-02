
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
 * - 2024-12-29: Enhanced refreshSellerStatus with more reliable verification and error recovery
 * - Updated to support automatic verification of all sellers
 * - 2025-07-13: Improved metadata-based seller detection to avoid unnecessary database queries
 * - 2025-07-14: Fixed authentication state updates to trust metadata exclusively without verification
 * - 2025-05-02: Enhanced session recovery and added explicit token refresh mechanisms
 */

import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSessionInitialization } from "./seller/useSessionInitialization";
import { useSellerRoleCheck } from "./seller/useSellerRoleCheck";
import { sellerProfileService } from "@/services/supabase";
import { CACHE_KEYS, saveToCache } from "@/services/offlineCacheService";
import { supabase } from "@/integrations/supabase/client";

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
  
  // Track recovery attempts to prevent infinite loops
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  
  // Enhanced session initialization with recovery mechanism
  useEffect(() => {
    let mounted = true;
    
    const initSession = async () => {
      // Initialize session state
      await initializeSession();
      
      // If session exists, immediately set seller status from metadata
      if (session?.user?.user_metadata?.role === 'seller' && !isSeller) {
        console.log("Setting isSeller=true from metadata during initialization");
        setIsSeller(true);
        
        // Cache the user profile with seller role
        saveToCache(CACHE_KEYS.USER_PROFILE, {
          id: session.user.id,
          role: 'seller',
          updated_at: new Date().toISOString(),
          is_verified: true,
          verification_status: 'verified'
        });
      }
      
      // If no session but not attempted recovery yet, try to recover
      if (!session && !recoveryAttempted && !isLoading) {
        setRecoveryAttempted(true);
        console.log("No session found, attempting recovery");
        
        try {
          // Attempt to refresh the session in case token is still valid
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error) {
            console.log("Session recovery failed:", error.message);
          } else if (data.session) {
            console.log("Session recovered successfully");
            // The listener will handle updating the state
          }
        } catch (recoveryError) {
          console.error("Error during session recovery:", recoveryError);
        }
      }
    };
    
    if (mounted) {
      initSession();
    }

    // Set up subscription to auth state changes
    const subscription = setupAuthListener();

    // Cleanup function
    return () => {
      mounted = false;
      subscription.data.subscription.unsubscribe();
    };
  }, [navigate, initializeSession, setupAuthListener, session, isSeller, setIsSeller, recoveryAttempted, isLoading]);

  /**
   * Force refresh seller status - simplified to focus on metadata
   * and only perform minimal database operations when needed
   */
  const refreshSellerStatus = useCallback(async () => {
    if (!session) {
      console.log("refreshSellerStatus: No session available");
      return false;
    }
    
    setIsLoading(true);
    console.log("refreshSellerStatus: Starting status verification for user:", session.user.id);
    
    try {
      // First check metadata for seller role - trust this completely
      if (session.user?.user_metadata?.role === 'seller') {
        console.log("refreshSellerStatus: User is seller based on metadata");
        setIsSeller(true);
        setIsLoading(false);
        
        // Even with metadata, try background sync to ensure database consistency
        // This won't block the UI or affect the seller status determination
        setTimeout(async () => {
          try {
            await sellerProfileService.registerSeller(session.user.id).catch(err => {
              console.log("Background sync attempted for consistency:", err);
            });
          } catch (error) {
            // Ignore errors, this is just for database consistency
          }
        }, 500);
        
        return true;
      }
      
      // If metadata doesn't confirm seller status, update it if database says they're a seller
      const roleCheckResult = await checkSellerRole(session);
      console.log("refreshSellerStatus: Role check result:", roleCheckResult);
      
      if (roleCheckResult) {
        // Update metadata to match database
        try {
          await supabase.auth.updateUser({
            data: { role: 'seller', is_verified: true }
          });
          console.log("refreshSellerStatus: Updated user metadata to match database");
        } catch (e) {
          console.log("Could not update user metadata, but continuing:", e);
        }
        
        setIsSeller(true);
        setIsLoading(false);
        return true;
      }
      
      // If database doesn't confirm seller status, try direct registration
      console.log("refreshSellerStatus: Role check failed, attempting direct registration");
      const registrationResult = await sellerProfileService.registerSeller(session.user.id);
      
      if (registrationResult) {
        console.log("refreshSellerStatus: Registration successful");
        
        // Update cache and metadata
        saveToCache(CACHE_KEYS.USER_PROFILE, {
          id: session.user.id,
          role: 'seller',
          updated_at: new Date().toISOString(),
          is_verified: true,
          verification_status: 'verified'
        });
        
        try {
          await supabase.auth.updateUser({
            data: { role: 'seller', is_verified: true }
          });
        } catch (e) {
          console.log("Could not update user metadata, but continuing:", e);
        }
        
        toast.success("Seller account activated");
        
        setIsSeller(true);
        setIsLoading(false);
        return true;
      }
      
      // If we get here, we couldn't establish seller status
      console.error("refreshSellerStatus: All verification methods failed");
      setIsSeller(false);
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error("refreshSellerStatus: Error during verification:", error);
      setIsSeller(false);
      setIsLoading(false);
      return false;
    }
  }, [session, checkSellerRole, setIsLoading, setIsSeller]);

  return {
    session,
    isLoading,
    isSeller,
    refreshSellerStatus
  };
};
