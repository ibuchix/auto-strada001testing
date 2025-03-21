
/**
 * Hook for verifying if a user is already registered as a seller
 */

import { useCallback } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { CACHE_KEYS, saveToCache } from "@/services/offlineCacheService";
import { AuthRegisterResult } from "../types";

export const useRegistrationVerification = () => {
  const supabaseClient = useSupabaseClient();

  /**
   * Checks if user is already registered as seller by examining metadata and database
   * Now considers all sellers as verified by default
   */
  const verifyRegistration = useCallback(async (userId: string): Promise<AuthRegisterResult> => {
    try {
      console.log("Checking if user already has seller role");
      const { data: user, error: userError } = await supabaseClient.auth.getUser();
      
      if (userError) {
        console.error("Error fetching user:", userError);
        return { success: false, error: "Could not verify user account" };
      }

      // Check if user already has seller role in metadata
      const hasSellerRole = user.user?.user_metadata?.role === 'seller';
      console.log("User metadata:", user.user?.user_metadata, "Has seller role:", hasSellerRole);

      if (hasSellerRole) {
        console.log("User already has seller role in metadata");
        
        // Update cache to ensure consistency
        saveToCache(CACHE_KEYS.USER_PROFILE, {
          id: user.user.id,
          role: 'seller',
          updated_at: new Date().toISOString(),
          is_verified: true,
          verification_status: 'verified'
        });
        
        // Check if seller record exists
        const { data: sellerExists, error: sellerCheckError } = await supabaseClient
          .from('sellers')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (sellerCheckError) {
          console.error("Error checking if seller exists:", sellerCheckError);
        }
          
        if (sellerExists) {
          console.log("Seller record already exists:", sellerExists);
          return { success: true };
        }
        
        console.log("Seller role found in metadata but no seller record exists");
      }
      
      return { success: false, error: "User is not registered as seller" };
    } catch (error) {
      console.error("Error verifying seller registration:", error);
      return { success: false, error: "Error during verification" };
    }
  }, [supabaseClient]);

  return { verifyRegistration };
};
