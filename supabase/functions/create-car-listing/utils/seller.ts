
/**
 * Seller utilities for create-car-listing
 * Created: 2025-04-19 - Extracted from inline implementation
 * Updated: 2025-05-06 - Modified getSellerName to use security definer function
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { logOperation } from "./logging.ts";

/**
 * Ensures a seller record exists for the given user ID
 * Creates one if it doesn't exist
 * 
 * @param supabase Supabase client
 * @param userId User ID to check/create seller for
 * @param requestId Request ID for tracking
 * @returns Object with success flag and seller data if found
 */
export async function ensureSellerExists(
  supabase: SupabaseClient, 
  userId: string,
  requestId: string
): Promise<{ success: boolean; seller?: any; error?: Error }> {
  try {
    // Check if seller exists and is verified
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('id, verification_status')
      .eq('user_id', userId)
      .single();
    
    if (!sellerError && seller) {
      logOperation('seller_found', { 
        requestId, 
        sellerId: seller.id,
        verificationStatus: seller.verification_status
      });
      
      return { success: true, seller };
    }
    
    // Create seller record if it doesn't exist
    logOperation('seller_not_found', {
      requestId,
      userId
    });
    
    const { data: newSeller, error: createError } = await supabase
      .from('sellers')
      .insert({
        user_id: userId,
        verification_status: 'verified',
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      logOperation('seller_creation_failed', {
        requestId,
        userId,
        error: createError.message
      }, 'error');
      
      return { success: false, error: createError };
    }
    
    logOperation('seller_created', {
      requestId,
      userId,
      newSellerId: newSeller?.id
    });
    
    return { success: true, seller: newSeller };
  } catch (error) {
    logOperation('ensure_seller_error', {
      requestId,
      userId,
      error: (error as Error).message
    }, 'error');
    
    return { success: false, error: error as Error };
  }
}

/**
 * Gets the seller name from profile data using a security definer function
 * 
 * @param supabase Supabase client
 * @param userId User ID to get name for
 * @returns Seller name or fallback
 */
export async function getSellerName(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  try {
    // First try using the security definer function get_profile
    const { data: profileData, error: profileError } = await supabase
      .rpc('get_profile', { p_user_id: userId });
      
    if (!profileError && profileData && profileData.length > 0) {
      const profile = profileData[0];
      
      // Return the first available name from profile
      if (profile.full_name) return profile.full_name;
      if (profile.name) return profile.name;
      if (profile.email) return profile.email.split('@')[0];
    }
    
    // If security definer function fails, try direct query as fallback
    if (profileError) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .maybeSingle();
        
      if (!error && profile) {
        return profile.full_name || 
               (profile.email ? profile.email.split('@')[0] : 'Unnamed Seller');
      }
    }
    
    // If all else fails, use generic name
    return 'Unnamed Seller';
  } catch {
    return 'Unnamed Seller';
  }
}
