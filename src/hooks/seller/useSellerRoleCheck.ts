
/**
 * Changes made:
 * - 2024-11-18: Created dedicated hook for seller role verification
 * - 2024-11-18: Extracted from useSellerSession to improve maintainability
 * - 2024-11-18: Enhanced fallback mechanisms for seller role detection
 * - 2024-11-19: Updated to use refactored profile and seller services
 * - 2024-11-20: Fixed type imports with proper import syntax
 * - Updated to support automatic verification of sellers
 * - 2025-07-12: Prioritized metadata checks over database queries to improve reliability
 * - 2025-07-12: Added quick-path resolution when metadata contains seller role
 * - 2025-05-06: Removed circular dependencies and improved logging
 */

import { useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { profileService, sellerProfileService } from "@/services/supabase";

/**
 * Hook providing functions to check if a user has seller role
 * Uses multiple fallback methods to ensure reliable role detection
 */
export const useSellerRoleCheck = () => {
  /**
   * Efficiently checks if a user has seller role using multiple methods with fallbacks
   * Prioritizes metadata check for maximum reliability and performance
   */
  const checkSellerRole = useCallback(async (currentSession: Session): Promise<boolean> => {
    try {
      // Method 1: Check user metadata first (fastest and most reliable path)
      console.log("Checking seller role from user metadata:", currentSession.user.user_metadata);
      if (currentSession.user.user_metadata?.role === 'seller') {
        console.log("User confirmed as seller via metadata");
        
        // Even though we're returning true, try to fix potential data inconsistencies 
        // in the background without blocking the UI
        setTimeout(async () => {
          try {
            // Try to ensure profile and seller records exist
            await sellerProfileService.registerSeller(currentSession.user.id).catch(err => {
              console.log("Background seller registration attempt failed, but it's okay:", err);
            });
          } catch (error) {
            // Silently catch errors to prevent any issues in the UI
            console.warn("Background synchronization failed, but it's not critical:", error);
          }
        }, 500);
        
        return true;
      }

      // Method 2: Check profiles table using the security definer function
      try {
        const profile = await profileService.getUserProfile(currentSession.user.id);
        
        if (profile?.role === 'seller') {
          console.log("User confirmed as seller via profile service");
          // Update user metadata to match profile role for future reference
          try {
            await supabase.auth.updateUser({
              data: { 
                role: 'seller',
                is_verified: true 
              }
            });
          } catch (err) {
            console.warn("Failed to update user metadata, but continuing:", err);
          }
          
          return true;
        }
      } catch (profileError) {
        // Don't throw here - continue to the next check method
        console.warn("Profile check via function failed, trying direct query:", profileError);
      }

      // Method 3: Check sellers table directly
      try {
        const seller = await sellerProfileService.getSellerProfile(currentSession.user.id);
          
        if (seller) {
          console.log("User confirmed as seller via sellers table");
          // Found in sellers table - update user metadata
          try {
            await supabase.auth.updateUser({
              data: { 
                role: 'seller',
                is_verified: true
              }
            });
            
            // Also ensure profile table is synced
            await supabase
              .from('profiles')
              .upsert({ 
                id: currentSession.user.id, 
                role: 'seller',
                updated_at: new Date().toISOString()
              }, { 
                onConflict: 'id',
                ignoreDuplicates: false 
              });
          } catch (err) {
            console.warn("Failed to update user data after seller check, but continuing:", err);
          }
          
          return true;
        }
      } catch (sellerError) {
        console.warn("Seller table check failed:", sellerError);
      }

      // Method 4: Use register_seller RPC if all else fails
      try {
        console.log("Attempting to register user as seller via RPC");
        const result = await sellerProfileService.registerSeller(currentSession.user.id);
        if (result) {
          console.log("Successfully registered as seller via RPC");
          return true;
        }
      } catch (registerError) {
        console.warn("Register seller RPC failed:", registerError);
      }
      
      // No seller status found after trying all methods
      console.log("User is not a seller after all verification methods");
      return false;
    } catch (error) {
      console.error('Error checking seller role:', error);
      return false;
    }
  }, []);

  return { checkSellerRole };
};
