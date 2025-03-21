
/**
 * Hook for handling the primary seller registration process
 */

import { useCallback } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { CACHE_KEYS, saveToCache } from "@/services/offlineCacheService";
import { sellerProfileService } from "@/services/supabase";
import { AuthRegisterResult } from "../types";

export const useRegistrationProcess = () => {
  const supabaseClient = useSupabaseClient();

  /**
   * Attempts to register a seller using the primary method via sellerProfileService
   */
  const performRegistration = useCallback(async (userId: string): Promise<AuthRegisterResult> => {
    try {
      console.log("Attempting registration via sellerProfileService");
      const serviceResult = await sellerProfileService.registerSeller(userId);
      
      if (serviceResult) {
        console.log("Seller registration successful via sellerProfileService");
        
        // Update cache for offline use
        saveToCache(CACHE_KEYS.USER_PROFILE, {
          id: userId,
          role: 'seller',
          updated_at: new Date().toISOString()
        });
        
        return { success: true };
      }
      
      return { success: false, error: "Primary registration method failed" };
    } catch (serviceError) {
      console.error("Error using sellerProfileService:", serviceError);
      return { success: false, error: "Error during primary registration" };
    }
  }, [supabaseClient]);

  return { performRegistration };
};
