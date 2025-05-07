
/**
 * Fallback methods for seller registration
 * Created: 2025-05-07 - Extracted from useSellerRegistration for better organization
 */

import { useCallback } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { AuthRegisterResult } from "../types";
import { CACHE_KEYS, saveToCache } from "@/services/offlineCacheService";

export const useRegistrationFallbacks = () => {
  const supabaseClient = useSupabaseClient();

  /**
   * Apply fallback methods when primary registration fails
   * Uses multiple approaches to ensure registration succeeds
   */
  const applyFallbackMethods = useCallback(async (userId: string): Promise<AuthRegisterResult> => {
    try {
      console.log("Using fallback registration methods for user:", userId);
      
      // First approach: Try direct register_seller RPC
      try {
        console.log("Fallback: Calling register_seller RPC");
        const { error: rpcError } = await supabaseClient.rpc('register_seller', {
          p_user_id: userId
        });
        
        if (!rpcError) {
          console.log("Fallback: RPC register_seller succeeded");
          
          // Update cache for consistency
          saveToCache(CACHE_KEYS.USER_PROFILE, {
            id: userId,
            role: 'seller',
            updated_at: new Date().toISOString()
          });
          
          return { success: true };
        }
        
        console.warn("Fallback: RPC register_seller failed:", rpcError);
      } catch (rpcError) {
        console.warn("Fallback: RPC register_seller threw exception:", rpcError);
      }
      
      // Second approach: Try security definer function with more privileges
      try {
        console.log("Fallback: Calling create_seller_if_not_exists RPC");
        const { data: createResult, error: createError } = await supabaseClient.rpc(
          'create_seller_if_not_exists',
          { p_user_id: userId }
        );
        
        if (!createError && createResult?.success) {
          console.log("Fallback: create_seller_if_not_exists succeeded:", createResult);
          
          // Update cache for consistency
          saveToCache(CACHE_KEYS.USER_PROFILE, {
            id: userId,
            role: 'seller',
            updated_at: new Date().toISOString()
          });
          
          return { success: true };
        }
        
        console.warn("Fallback: create_seller_if_not_exists failed:", createError || "Unknown error");
      } catch (createError) {
        console.warn("Fallback: create_seller_if_not_exists threw exception:", createError);
      }
      
      // Third approach: Try to update user metadata directly
      try {
        console.log("Fallback: Updating user metadata directly");
        const { error: metadataError } = await supabaseClient.auth.updateUser({
          data: { 
            role: 'seller',
            is_verified: true
          }
        });
        
        if (!metadataError) {
          console.log("Fallback: Successfully updated user metadata with seller role");
          
          // Update cache as a last resort
          saveToCache(CACHE_KEYS.USER_PROFILE, {
            id: userId,
            role: 'seller',
            updated_at: new Date().toISOString()
          });
          
          return { success: true };
        }
        
        console.warn("Fallback: Failed to update user metadata:", metadataError);
      } catch (metadataError) {
        console.warn("Fallback: Error updating metadata:", metadataError);
      }
      
      // All approaches failed
      return { 
        success: false, 
        error: "All registration fallback methods failed" 
      };
    } catch (error: any) {
      console.error("Error in registration fallbacks:", error);
      return { 
        success: false, 
        error: error.message || "Unknown error in fallback registration" 
      };
    }
  }, [supabaseClient]);

  return { applyFallbackMethods };
};
