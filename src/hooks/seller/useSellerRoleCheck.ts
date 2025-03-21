
/**
 * Changes made:
 * - 2024-11-18: Created dedicated hook for seller role verification
 * - 2024-11-18: Extracted from useSellerSession to improve maintainability
 * - 2024-11-18: Enhanced fallback mechanisms for seller role detection
 * - 2024-11-19: Updated to use refactored profile and seller services
 * - 2024-11-20: Fixed type imports with proper import syntax
 * - Updated to support automatic verification of sellers
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
   * Updated to expect sellers are automatically verified
   */
  const checkSellerRole = useCallback(async (currentSession: Session) => {
    try {
      // Method 1: Check user metadata first (fastest path)
      if (currentSession.user.user_metadata?.role === 'seller') {
        return true;
      }

      // Method 2: Check profiles table using the security definer function
      try {
        const profile = await profileService.getUserProfile(currentSession.user.id);
        
        if (profile?.role === 'seller') {
          // Update user metadata to match profile role for future reference
          await supabase.auth.updateUser({
            data: { 
              role: 'seller',
              is_verified: true 
            }
          });
          
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
          // Found in sellers table - update user metadata
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
          
          return true;
        }
      } catch (sellerError) {
        console.warn("Seller table check failed:", sellerError);
      }

      // Method 4: Use register_seller RPC if all else fails
      try {
        const result = await sellerProfileService.registerSeller(currentSession.user.id);
        if (result) {
          console.log("Successfully registered as seller via RPC");
          return true;
        }
      } catch (registerError) {
        console.warn("Register seller RPC failed:", registerError);
      }
      
      // No seller status found after trying all methods
      return false;
    } catch (error) {
      console.error('Error checking seller role:', error);
      return false;
    }
  }, []);

  return { checkSellerRole };
};
