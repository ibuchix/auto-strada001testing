
/**
 * Seller utilities for create-car-listing
 * Created: 2025-05-06 - Moved from external dependency to local implementation
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { logOperation } from "./logging.ts";

/**
 * Ensures a seller record exists for the given user
 * 
 * @param supabase Supabase client
 * @param userId User ID
 * @param requestId Request ID for tracking
 * @returns Result with success flag
 */
export async function ensureSellerExists(
  supabase: SupabaseClient,
  userId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if seller exists first using security definer function
    const { data: result, error: rpcError } = await supabase.rpc(
      'check_seller_exists',
      { p_user_id: userId }
    );
    
    if (rpcError) {
      // Fall back to direct query if RPC fails
      const { data: seller, error: sellerError } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (!sellerError && seller) {
        logOperation('seller_exists', { requestId, userId });
        return { success: true };
      }
      
      if (sellerError && sellerError.code !== 'PGRST116') {
        // Only log true errors, not "no rows returned" errors
        logOperation('seller_check_error', {
          requestId,
          userId,
          error: sellerError.message
        }, 'error');
      }
    } else if (result?.exists) {
      logOperation('seller_exists_via_rpc', { requestId, userId });
      return { success: true };
    }
    
    // Seller doesn't exist, create one
    logOperation('creating_seller', { requestId, userId });
    
    // Try to use the security definer function first
    const { data: createResult, error: createRpcError } = await supabase.rpc(
      'create_seller_if_not_exists',
      { p_user_id: userId }
    );
    
    if (!createRpcError && createResult?.success) {
      logOperation('seller_created_via_rpc', { requestId, userId });
      return { success: true };
    }
    
    // Fallback to direct insert if RPC fails
    if (createRpcError) {
      logOperation('rpc_create_failed', {
        requestId,
        userId,
        error: createRpcError.message
      }, 'warn');
      
      const { data: inserted, error: insertError } = await supabase
        .from('sellers')
        .insert({
          user_id: userId,
          verification_status: 'pending'
        })
        .select()
        .single();
      
      if (insertError) {
        logOperation('seller_creation_error', {
          requestId,
          userId,
          error: insertError.message
        }, 'error');
        
        return { success: false, error: `Failed to create seller: ${insertError.message}` };
      }
      
      logOperation('seller_created', { requestId, userId });
      return { success: true };
    }
    
    return { success: true };
  } catch (error) {
    logOperation('seller_ensure_error', {
      requestId,
      userId,
      error: (error as Error).message
    }, 'error');
    
    return { success: false, error: `Seller verification error: ${(error as Error).message}` };
  }
}

/**
 * Gets seller name from user profile data
 * 
 * @param supabase Supabase client
 * @param userId User ID
 * @returns Seller name
 */
export async function getSellerName(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  try {
    // Try to get the user profile using the security definer function
    const { data: profile, error } = await supabase.rpc(
      'get_user_profile_for_listing',
      { p_user_id: userId }
    );

    if (!error && profile) {
      return profile.full_name || 'Unknown Seller';
    }

    // Fallback to direct query if RPC fails
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    if (!userError && userData?.full_name) {
      return userData.full_name;
    }

    return 'Unknown Seller';
  } catch (error) {
    console.error('Error getting seller name:', error);
    return 'Unknown Seller';
  }
}
