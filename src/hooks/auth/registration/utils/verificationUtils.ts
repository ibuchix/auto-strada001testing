
/**
 * Created: 2024-08-19
 * Utility functions for verifying fallback registration methods
 */

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifies if a user was successfully registered as a seller
 * using fallback methods
 */
export const verifyFallbackRegistration = async (
  supabaseClient: SupabaseClient,
  userId: string
) => {
  try {
    // Check user metadata
    const { data: user, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.error("Error fetching user during verification:", userError);
      return { success: false, error: "Could not verify user metadata" };
    }
    
    const hasSellerRole = user.user?.user_metadata?.role === 'seller';
    
    // Check profile table
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error("Error checking profile during verification:", profileError);
    }
    
    const profileHasSellerRole = profile?.role === 'seller';
    
    // Check seller record
    const { data: seller, error: sellerError } = await supabaseClient
      .from('sellers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (sellerError) {
      console.error("Error checking seller during verification:", sellerError);
    }
    
    const hasSellerRecord = !!seller;
    
    // If at least two out of three checks pass, consider it a success
    const checksPassedCount = [
      hasSellerRole,
      profileHasSellerRole,
      hasSellerRecord
    ].filter(Boolean).length;
    
    if (checksPassedCount >= 2) {
      console.log("Fallback registration verification passed with", checksPassedCount, "out of 3 checks");
      return { success: true };
    }
    
    console.warn("Fallback registration verification failed with only", checksPassedCount, "out of 3 checks");
    return { 
      success: false, 
      error: "Could not verify registration was completed" 
    };
  } catch (error) {
    console.error("Error during fallback verification:", error);
    return { success: false, error: "Error during verification" };
  }
};
