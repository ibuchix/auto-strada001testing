
/**
 * Hook for applying fallback registration methods
 */

import { useCallback } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { CACHE_KEYS, saveToCache } from "@/services/offlineCacheService";
import { AuthRegisterResult } from "../types";
import { verifyFallbackRegistration } from "./utils/verificationUtils";

export const useRegistrationFallbacks = () => {
  const supabaseClient = useSupabaseClient();

  /**
   * Applies fallback methods to register a seller when primary methods fail
   * Now includes automatic verification as part of the process
   */
  const applyFallbackMethods = useCallback(async (userId: string): Promise<AuthRegisterResult> => {
    try {
      console.log("Applying fallback registration methods for user:", userId);
      
      // Step 1: Direct registration approach - try each component of registration separately
      
      // Step 1.1: Update user metadata
      console.log("Updating user metadata with seller role");
      try {
        const { error: metadataError } = await supabaseClient.auth.updateUser({
          data: { 
            role: 'seller',
            is_verified: true
          }
        });

        if (metadataError) {
          console.error("Error updating user metadata:", metadataError);
          // Continue with other steps even if metadata update fails
        } else {
          console.log("Successfully updated user metadata with seller role");
        }
      } catch (metadataError) {
        console.error("Exception updating user metadata:", metadataError);
        // Continue with other steps
      }
      
      // Step 1.2: Try using the RPC function
      let rpcSuccess = false;
      try {
        console.log("Trying to register via RPC function");
        const { error: rpcError } = await supabaseClient.rpc('register_seller', {
          p_user_id: userId
        });
        
        if (!rpcError) {
          console.log("RPC register_seller succeeded");
          rpcSuccess = true;
        } else {
          console.warn("RPC register_seller failed:", rpcError);
        }
      } catch (rpcError) {
        console.warn("RPC register_seller threw exception:", rpcError);
      }
      
      // Step 1.3: If RPC failed, try direct table operations
      if (!rpcSuccess) {
        console.log("Attempting manual table updates");
        
        // Step 1.3.1: Check profile table
        try {
          // First check if profile exists
          const { data: profileExists, error: profileCheckError } = await supabaseClient
            .from('profiles')
            .select('id, role')
            .eq('id', userId)
            .maybeSingle();
            
          if (profileCheckError) {
            console.error("Error checking profile:", profileCheckError);
          }
          
          if (profileExists) {
            console.log("Profile exists, updating with seller role:", profileExists);
            const { error: profileUpdateError } = await supabaseClient
              .from('profiles')
              .update({ 
                role: 'seller',
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);
              
            if (profileUpdateError) {
              console.error("Error updating profile:", profileUpdateError);
            }
          } else {
            console.log("Profile doesn't exist, creating with seller role");
            const { error: profileCreateError } = await supabaseClient
              .from('profiles')
              .insert({ 
                id: userId, 
                role: 'seller',
                updated_at: new Date().toISOString()
              });
              
            if (profileCreateError) {
              console.error("Error creating profile:", profileCreateError);
            }
          }
        } catch (profileError) {
          console.error("Exception in profile operations:", profileError);
        }
        
        // Step 1.3.2: Check seller table
        try {
          // Check if seller record exists
          const { data: sellerExists, error: sellerCheckError } = await supabaseClient
            .from('sellers')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
            
          if (sellerCheckError) {
            console.error("Error checking if seller exists:", sellerCheckError);
          }
            
          if (!sellerExists) {
            console.log("Seller record doesn't exist, creating new seller record");
            const { error: sellerCreateError } = await supabaseClient
              .from('sellers')
              .insert({
                user_id: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                verification_status: 'verified',
                is_verified: true
              });
              
            if (sellerCreateError) {
              console.error("Error creating seller record:", sellerCreateError);
            }
          } else {
            console.log("Seller record already exists:", sellerExists);
          }
        } catch (sellerError) {
          console.error("Exception in seller operations:", sellerError);
        }
      }
      
      // Step 2: Verify registration was successful using multiple methods
      const verificationResult = await verifyFallbackRegistration(supabaseClient, userId);
      
      // Save to cache regardless of verification outcome (best effort)
      saveToCache(CACHE_KEYS.USER_PROFILE, {
        id: userId,
        role: 'seller',
        updated_at: new Date().toISOString(),
        is_verified: true,
        verification_status: 'verified'
      });
      
      return verificationResult;
    } catch (error) {
      console.error("Error in fallback registration:", error);
      return { success: false, error: "Fallback registration methods failed" };
    }
  }, [supabaseClient]);

  return { applyFallbackMethods };
};
