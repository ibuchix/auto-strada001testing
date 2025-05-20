
/**
 * Changes made:
 * - 2024-12-31: Extracted registration logic from sellerProfileService.ts
 * - Updated to support automatic verification
 * - 2025-06-21: Ensured consistent field naming (verification_status and is_verified) across all methods
 * - 2025-06-22: Updated to prioritize RPC functions over direct table operations to avoid permission issues
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
      
      // Primary approach: Try using ensure_seller_registration RPC function first
      // This is a security definer function that bypasses RLS and handles everything
      try {
        console.log("SellerRegistrationService: Using ensure_seller_registration RPC function");
        const { data: rpcResult, error: rpcError } = await this.supabase.rpc(
          'ensure_seller_registration', 
          { p_user_id: userId }
        );
        
        if (!rpcError && rpcResult?.success) {
          console.log("SellerRegistrationService: Successfully registered via ensure_seller_registration RPC function");
          return true;
        }
        
        if (rpcError) {
          console.warn("SellerRegistrationService: ensure_seller_registration RPC failed, trying alternate methods:", rpcError);
        }
      } catch (rpcError) {
        console.error("SellerRegistrationService: ensure_seller_registration RPC failed:", rpcError);
      }
      
      // Fallback 1: Try using register_seller RPC function
      try {
        console.log("SellerRegistrationService: Using register_seller RPC function");
        const { data, error } = await this.supabase.rpc('register_seller', {
          p_user_id: userId
        });
        
        if (!error && data) {
          console.log("SellerRegistrationService: Successfully registered via register_seller RPC function");
          
          // Verify the registration was successful by checking for profile and seller records
          await sellerVerificationService.verifySellerRegistration(userId);
          
          return true;
        }
        
        if (error) {
          console.warn("SellerRegistrationService: register_seller RPC failed:", error);
        }
      } catch (registerError) {
        console.error("SellerRegistrationService: register_seller RPC failed:", registerError);
      }
      
      // Fallback 2: Try using create_seller_if_not_exists RPC function
      try {
        console.log("SellerRegistrationService: Using create_seller_if_not_exists RPC function");
        const { data: createResult, error: createError } = await this.supabase.rpc(
          'create_seller_if_not_exists',
          { p_user_id: userId }
        );
        
        if (!createError && createResult?.success) {
          console.log("SellerRegistrationService: Successfully registered via create_seller_if_not_exists RPC function");
          return true;
        }
        
        if (createError) {
          console.warn("SellerRegistrationService: create_seller_if_not_exists RPC failed:", createError);
        }
      } catch (createError) {
        console.error("SellerRegistrationService: create_seller_if_not_exists RPC failed:", createError);
      }
      
      // Last resort: Manual method (likely to fail with permission denied)
      console.warn("SellerRegistrationService: All RPC methods failed, attempting direct table operations (may fail due to permissions)");
      
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
            verification_status: 'verified',
            is_verified: true
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
      
      // Verify the registration was successful
      await sellerVerificationService.verifySellerRegistration(userId);
      
      console.log("SellerRegistrationService: Manual registration successful");
      return true;
        
    } catch (error: any) {
      this.handleError(error, "Failed to register as seller");
      return false;
    }
  }
}

// Export a singleton instance
export const sellerRegistrationService = new SellerRegistrationService();
