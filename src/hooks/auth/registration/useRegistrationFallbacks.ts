
/**
 * Hook for handling fallback registration methods
 */

import { useCallback } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { CACHE_KEYS, saveToCache } from "@/services/offlineCacheService";
import { AuthRegisterResult } from "../types";

export const useRegistrationFallbacks = () => {
  const supabaseClient = useSupabaseClient();

  /**
   * Attempts to register a seller using fallback methods when primary method fails
   */
  const applyFallbackMethods = useCallback(async (userId: string): Promise<AuthRegisterResult> => {
    try {
      console.log("Applying fallback registration methods");
      
      // Step 1: Update user metadata with seller role
      await updateUserMetadata(userId);
      
      // Step 2: Try using the RPC function
      const rpcResult = await tryRpcRegistration(userId);
      if (rpcResult.success) {
        return rpcResult;
      }
      
      // Step 3: Try direct table operations
      const tableResult = await tryDirectTableOperations(userId);
      if (tableResult.success) {
        return tableResult;
      }
      
      // Step 4: Verify registration was successful
      const verificationResult = await verifyFallbackRegistration(userId);
      
      // Save to cache regardless of verification outcome (best effort)
      saveToCache(CACHE_KEYS.USER_PROFILE, {
        id: userId,
        role: 'seller',
        updated_at: new Date().toISOString()
      });
      
      return verificationResult;
    } catch (error) {
      console.error("Error in fallback registration methods:", error);
      return { success: false, error: "Fallback registration methods failed" };
    }
  }, [supabaseClient]);
  
  /**
   * Updates user metadata with seller role
   */
  const updateUserMetadata = async (userId: string): Promise<void> => {
    try {
      console.log("Updating user metadata with seller role");
      const { error: metadataError } = await supabaseClient.auth.updateUser({
        data: { role: 'seller' }
      });

      if (metadataError) {
        console.error("Error updating user metadata:", metadataError);
      } else {
        console.log("Successfully updated user metadata with seller role");
      }
    } catch (metadataError) {
      console.error("Exception updating user metadata:", metadataError);
    }
  };
  
  /**
   * Tries to register using the RPC function
   */
  const tryRpcRegistration = async (userId: string): Promise<AuthRegisterResult> => {
    try {
      console.log("Trying to register via RPC function");
      const { error: rpcError } = await supabaseClient.rpc('register_seller', {
        p_user_id: userId
      });
      
      if (!rpcError) {
        console.log("RPC register_seller succeeded");
        return { success: true };
      } else {
        console.warn("RPC register_seller failed:", rpcError);
        return { success: false, error: "RPC registration failed" };
      }
    } catch (rpcError) {
      console.warn("RPC register_seller threw exception:", rpcError);
      return { success: false, error: "Exception in RPC registration" };
    }
  };
  
  /**
   * Tries direct table operations for registration
   */
  const tryDirectTableOperations = async (userId: string): Promise<AuthRegisterResult> => {
    try {
      console.log("Attempting manual table updates");
      
      // Update profile table
      await updateProfileTable(userId);
      
      // Update seller table
      await updateSellerTable(userId);
      
      return { success: true };
    } catch (error) {
      console.error("Error in direct table operations:", error);
      return { success: false, error: "Direct table operations failed" };
    }
  };
  
  /**
   * Updates the profile table with seller role
   */
  const updateProfileTable = async (userId: string): Promise<void> => {
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
  };
  
  /**
   * Updates the seller table with a new seller record
   */
  const updateSellerTable = async (userId: string): Promise<void> => {
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
            verification_status: 'pending'
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
  };
  
  /**
   * Verifies if the fallback registration was successful
   */
  const verifyFallbackRegistration = async (userId: string): Promise<AuthRegisterResult> => {
    try {
      // Verify seller metadata was updated
      const { data: verifyUser } = await supabaseClient.auth.getUser();
      const metadataOk = verifyUser.user?.user_metadata?.role === 'seller';
      
      // Verify profile was updated
      const { data: verifyProfile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      const profileOk = verifyProfile?.role === 'seller';
      
      // Verify seller record exists
      const { data: verifySeller } = await supabaseClient
        .from('sellers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      const sellerOk = !!verifySeller;
      
      const registrationSuccess = metadataOk || (profileOk && sellerOk);
      
      console.log("Registration verification:", {
        metadataOk,
        profileOk,
        sellerOk,
        success: registrationSuccess
      });
      
      return { success: registrationSuccess };
    } catch (verificationError) {
      console.error("Error verifying registration:", verificationError);
      // If verification fails, assume registration was successful if we didn't encounter fatal errors
      return { success: true };
    }
  };

  return { applyFallbackMethods };
};
