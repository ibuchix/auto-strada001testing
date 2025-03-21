
/**
 * Changes made:
 * - 2024-12-31: Refactored into smaller utility files
 * 
 * Hook for handling fallback registration methods
 */

import { useCallback } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { CACHE_KEYS, saveToCache } from "@/services/offlineCacheService";
import { AuthRegisterResult } from "../types";
import { updateUserMetadata } from "./utils/metadataUtils";
import { tryRpcRegistration } from "./utils/rpcUtils";
import { tryDirectTableOperations } from "./utils/tableUtils";
import { verifyFallbackRegistration } from "./utils/verificationUtils";

export const useRegistrationFallbacks = () => {
  const supabaseClient = useSupabaseClient();

  /**
   * Attempts to register a seller using fallback methods when primary method fails
   * Using dedicated utility functions for each fallback mechanism
   */
  const applyFallbackMethods = useCallback(async (userId: string): Promise<AuthRegisterResult> => {
    try {
      console.log("Applying fallback registration methods");
      
      // Step 1: Update user metadata with seller role
      await updateUserMetadata(supabaseClient, userId);
      
      // Step 2: Try using the RPC function
      const rpcResult = await tryRpcRegistration(supabaseClient, userId);
      if (rpcResult.success) {
        return rpcResult;
      }
      
      // Step 3: Try direct table operations
      const tableResult = await tryDirectTableOperations(supabaseClient, userId);
      if (tableResult.success) {
        return tableResult;
      }
      
      // Step 4: Verify registration was successful
      const verificationResult = await verifyFallbackRegistration(supabaseClient, userId);
      
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

  return { applyFallbackMethods };
};
