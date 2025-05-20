
/**
 * Changes made:
 * - 2024-12-31: Extracted registration logic from sellerProfileService.ts
 * - Updated to support automatic verification
 * - 2025-06-21: Ensured consistent field naming (verification_status and is_verified) across all methods
 */

import { BaseService } from "../baseService";
import { sellerVerificationService } from "./sellerVerificationService";
import { SellerRegistrationResult } from "./types";

/**
 * Service for seller registration functionality
 */
export class SellerRegistrationService extends BaseService {
  /**
   * Register as a seller with automatic verification
   * Designed to work with RLS policies
   */
  async registerSeller(userId: string): Promise<boolean> {
    try {
      console.log("SellerRegistrationService: Starting registration for user ID:", userId);
      
      // Stage 1: Update user metadata first
      try {
        const { error: metadataError } = await this.supabase.auth.updateUser({
          data: { 
            role: 'seller',
            is_verified: true
          }
        });
        
        if (metadataError) {
          console.error("SellerRegistrationService: Failed to update user metadata:", metadataError);
        } else {
          console.log("SellerRegistrationService: Successfully updated user metadata with seller role");
        }
      } catch (metadataError) {
        console.error("SellerRegistrationService: Failed to update user metadata:", metadataError);
      }
      
      // Stage 2: Try using the RPC function first (security definer function that bypasses RLS)
      const { data, error } = await this.supabase.rpc('register_seller', {
        p_user_id: userId
      });
      
      if (!error && data) {
        console.log("SellerRegistrationService: Successfully registered via RPC function");
        
        // Verify the registration was successful by checking for profile and seller records
        await sellerVerificationService.verifySellerRegistration(userId);
        
        return true;
      }
      
      if (error) {
        console.warn("SellerRegistrationService: RPC register_seller failed, falling back to manual methods:", error);
        
        // Fallback method: Try to update profile directly
        try {
          console.log("SellerRegistrationService: Attempting manual profile creation/update");
          
          // First check if profile exists
          const { data: profileExists } = await this.supabase
            .from('profiles')
            .select('id, role')
            .eq('id', userId)
            .maybeSingle();
            
          if (profileExists) {
            console.log("SellerRegistrationService: Profile exists, updating role:", profileExists);
            // Update existing profile
            const { error: profileUpdateError } = await this.supabase
              .from('profiles')
              .update({ 
                role: 'seller',
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);
              
            if (profileUpdateError) {
              console.error("SellerRegistrationService: Failed to update profile:", profileUpdateError);
            }
          } else {
            console.log("SellerRegistrationService: Profile doesn't exist, creating new profile");
            // Create new profile
            const { error: profileCreateError } = await this.supabase
              .from('profiles')
              .insert({ 
                id: userId, 
                role: 'seller',
                updated_at: new Date().toISOString()
              });
              
            if (profileCreateError) {
              console.error("SellerRegistrationService: Failed to create profile:", profileCreateError);
            }
          }
              
          // Check if seller record exists, create if needed
          const { data: sellerExists } = await this.supabase
            .from('sellers')
            .select('id, user_id')
            .eq('user_id', userId)
            .maybeSingle();
              
          if (!sellerExists) {
            console.log("SellerRegistrationService: Seller record doesn't exist, creating new seller record");
            const { error: sellerCreateError } = await this.supabase
              .from('sellers')
              .insert({
                user_id: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                verification_status: 'verified', // Set as verified
                is_verified: true                // Set as verified
              });
              
            if (sellerCreateError) {
              console.error("SellerRegistrationService: Failed to create seller record:", sellerCreateError);
              throw sellerCreateError;
            }
          } else {
            console.log("SellerRegistrationService: Seller record already exists:", sellerExists);
            
            // Ensure seller is marked as verified
            const { error: sellerUpdateError } = await this.supabase
              .from('sellers')
              .update({
                verification_status: 'verified',
                is_verified: true,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId);
              
            if (sellerUpdateError) {
              console.error("SellerRegistrationService: Failed to update seller verification:", sellerUpdateError);
            }
          }
          
          // Verify the manual registration was successful
          await sellerVerificationService.verifySellerRegistration(userId);
          
          console.log("SellerRegistrationService: Manual registration successful");
          return true;
        } catch (fallbackError) {
          console.error("SellerRegistrationService: All seller registration methods failed:", fallbackError);
          throw fallbackError;
        }
      }
      
      return !!data;
    } catch (error: any) {
      this.handleError(error, "Failed to register as seller");
      return false;
    }
  }
}

// Export a singleton instance
export const sellerRegistrationService = new SellerRegistrationService();
