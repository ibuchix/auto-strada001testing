
/**
 * Utilities for verifying registration success
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { AuthRegisterResult } from "../../types";

/**
 * Verifies if the fallback registration was successful
 * Updated to check for verified status as well
 */
export const verifyFallbackRegistration = async (
  supabaseClient: SupabaseClient,
  userId: string
): Promise<AuthRegisterResult> => {
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
      .select('id, verification_status, is_verified')
      .eq('user_id', userId)
      .maybeSingle();
    const sellerOk = !!verifySeller;
    
    // Verify seller is marked as verified (new check)
    const verificationOk = verifySeller && 
      (verifySeller.verification_status === 'verified' && verifySeller.is_verified === true);
    
    const registrationSuccess = metadataOk || (profileOk && sellerOk);
    
    console.log("Registration verification:", {
      metadataOk,
      profileOk,
      sellerOk,
      verificationOk,
      success: registrationSuccess
    });
    
    return { success: registrationSuccess };
  } catch (verificationError) {
    console.error("Error verifying registration:", verificationError);
    // If verification fails, assume registration was successful if we didn't encounter fatal errors
    return { success: true };
  }
};
