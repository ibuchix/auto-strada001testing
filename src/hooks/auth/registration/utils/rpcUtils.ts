
/**
 * Utilities for RPC-based registration fallbacks
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { AuthRegisterResult } from "../../types";

/**
 * Tries to register using the RPC function
 */
export const tryRpcRegistration = async (
  supabaseClient: SupabaseClient,
  userId: string
): Promise<AuthRegisterResult> => {
  try {
    console.log("Trying to register via RPC function");
    
    // First try ensure_seller_registration with user_id parameter
    const { error: ensureError } = await supabaseClient.rpc('ensure_seller_registration', {
      p_user_id: userId
    });
    
    if (!ensureError) {
      console.log("RPC ensure_seller_registration succeeded");
      return { success: true };
    } else {
      console.warn("RPC ensure_seller_registration failed, trying register_seller:", ensureError);
    }
    
    // Fall back to register_seller
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
